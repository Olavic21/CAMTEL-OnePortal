"""
Module d'abstraction LLM + RAG pour OnePortal AI.

Fournit : LLMProvider / EmbeddingProvider (interfaces), MockLLMProvider,
GeminiProvider, OpenAIProvider, OllamaProvider, get_llm_provider() factory,
build_rag_prompt() / run_rag_pipeline().
Les SDKs sont importes lazy dans les constructeurs.
"""
import hashlib
import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

from django.core.exceptions import ImproperlyConfigured
from django.conf import settings

logger = logging.getLogger(__name__)

__all__ = [
    "LLMProvider",
    "EmbeddingProvider",
    "MockLLMProvider",
    "GeminiProvider",
    "OpenAIProvider",
    "OllamaProvider",
    "get_llm_provider",
    "get_provider",
    "build_rag_prompt",
    "run_rag_pipeline",
]


# ---------------------------------------------------------------------------
# Rate limiting simple (in-memory, par process)
# ---------------------------------------------------------------------------

_last_call: Dict[str, float] = {}
_MIN_INTERVAL = getattr(settings, "CHATBOT_RATE_LIMIT", 0.0)
_provider_cache: Dict[str, Any] = {}


def _rate_limit_guard():
    """Pause minimale entre appels pour un meme provider (dev only)."""
    now = time.monotonic()
    last = _last_call.get("default", 0.0)
    elapsed = now - last
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _last_call["default"] = time.monotonic()


def _md5_hash(text: str) -> List[float]:
    """Fallback embedding : hache MD5 normalise en 16 float."""
    h = hashlib.md5(text.encode("utf-8")).hexdigest()
    return [int(h[i : i + 2], 16) / 255.0 for i in range(0, 32, 2)]


class _LLMCallTimeout(Exception):
    """Leve quand un appel LLM depasse le delai maximum autorise."""


def _call_with_hard_timeout(func, _timeout_seconds: Optional[float], *args, **kwargs):
    """Execute `func` avec un timeout mur (wall-clock) strict, en filet de
    securite au-dessus du timeout natif de chaque SDK.

    Pourquoi : constate en conditions reelles que le parametre
    `request_options={"timeout": N}` du SDK google-generativeai ne borne
    PAS toujours la duree reelle d'un appel — lors d'echecs repetes au niveau
    transport (ex: connexion TLS qui echoue en boucle), le client gRPC
    continue de retenter bien au-dela du timeout demande. Sans ce filet, le
    thread de la requete Django peut rester bloque indefiniment.

    Limite assumee : on ne peut pas tuer un thread Python de force. Si le
    timeout expire, cette fonction leve `_LLMCallTimeout` et rend la main —
    mais l'appel SDK abandonne peut continuer de s'executer en arriere-plan
    jusqu'a sa propre resolution (succes, erreur, ou epuisement de ses
    propres tentatives internes), consommant un thread jusque-la. C'est un
    compromis correct : la requete utilisateur n'est plus bloquee, au prix
    d'une consommation de ressource residuelle bornee par la robustesse du
    SDK lui-meme.
    """
    if not _timeout_seconds:
        return func(*args, **kwargs)

    result: Dict[str, Any] = {}

    def _target():
        try:
            result["value"] = func(*args, **kwargs)
        except Exception as exc:  # noqa: BLE001 - relaye tel quel au thread appelant
            result["error"] = exc

    thread = threading.Thread(target=_target, daemon=True)
    thread.start()
    thread.join(timeout=_timeout_seconds)

    if thread.is_alive():
        raise _LLMCallTimeout(
            f"Appel LLM abandonne apres {_timeout_seconds}s (le thread sous-jacent continue "
            "en arriere-plan, voir docstring _call_with_hard_timeout)."
        )
    if "error" in result:
        raise result["error"]
    return result.get("value")


# ---------------------------------------------------------------------------
# Interfaces abstraites
# ---------------------------------------------------------------------------


class LLMProvider:
    """Interface minimale pour un fournisseur de LLM."""

    @property
    def model_name(self) -> str:
        raise NotImplementedError

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> str:
        raise NotImplementedError

    @property
    def supports_vision(self) -> bool:
        return False


class EmbeddingProvider:
    """Interface minimale pour un fournisseur d'embeddings."""

    def embed_text(self, text: str) -> List[float]:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Provider Mock (tests / dev / fallback)
# ---------------------------------------------------------------------------


class MockLLMProvider(LLMProvider, EmbeddingProvider):
    """Provider factice : rends le code testable sans cle API ni serveur LLM."""

    def __init__(self, model_name: str = "mock-gpt", **kwargs: Any) -> None:
        self._model_name = model_name

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> str:
        _rate_limit_guard()
        prompt_str = prompt[:200]
        return f"[REPONSE_FACTICE] Contexte traite: {prompt_str}"

    def embed_text(self, text: str) -> List[float]:
        return _md5_hash(text)

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def supports_vision(self) -> bool:
        return False


# ---------------------------------------------------------------------------
# Provider Gemini (Google)
# ---------------------------------------------------------------------------


class GeminiProvider(LLMProvider, EmbeddingProvider):
    """Provider Gemini via le SDK google-generativeai.

    Necessite :
        pip install google-generativeai

    La cle API peut etre fournie via api_key= ou lue depuis
    settings.GOOGLE_API_KEY / variable d'environnement GOOGLE_API_KEY.
    """

    def __init__(
        self,
        model_name: str = "gemini-1.5-flash",
        api_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        self._model_name = model_name
        self._api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        if not self._api_key:
            self._api_key = getattr(settings, "GOOGLE_API_KEY", None)
        if not self._api_key:
            raise ImproperlyConfigured(
                "GeminiProvider requiert une cle API. Fournissez api_key= "
                "ou definissez GOOGLE_API_KEY dans l'environnement."
            )
        try:
            import google.generativeai as genai  # type: ignore
            self._genai = genai
        except ImportError:
            raise ImproperlyConfigured(
                "Le package google-generativeai n'est pas installe."
                " Installez-le avec : pip install google-generativeai."
            )
        genai.configure(api_key=self._api_key)

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> str:
        _rate_limit_guard()
        model = self._genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system_instruction,
        )
        generation_config: Dict[str, Any] = {}
        if temperature is not None:
            generation_config["temperature"] = temperature
        if max_tokens is not None:
            generation_config["max_output_tokens"] = max_tokens
        request_options: Dict[str, Any] = {}
        if timeout is not None:
            # Le SDK google-generativeai utilise gRPC ; sans ce timeout
            # explicite, une connexion qui echoue silencieusement peut
            # retenter pendant plusieurs minutes sans jamais lever
            # d'exception (constate en conditions reelles).
            request_options["timeout"] = timeout
        try:
            response = model.generate_content(
                prompt,
                generation_config=generation_config or None,
                request_options=request_options or None,
            )
        except Exception as exc:
            # Google renvoie 404 NotFound quand le modele n'existe pas (ex:
            # 'gemini-1.5-flash' absent de l'endpoint). Le SDK ne le traduit
            # pas toujours clairement -> on enrichit le message pour faciliter
            # le diagnostic (modele invalide vs. vraie erreur d'auth).
            if "not found" in str(exc).lower() or "404" in str(exc):
                logger.error(
                    "Gemini model '%s' introuvable (404). Verifiez CHATBOT_MODEL. "
                    "Models disponibles : gemini-3.6-flash, gemini-3.5-flash, "
                    "gemini-2.5-flash, gemini-pro-latest. Erreur : %s",
                    self._model_name,
                    exc,
                )
            raise
        # Robustesse : une reponse sans partie de texte (ex: filtre de securite
        # Gemini, finish_reason SAFETY, ou contenu vide) ne doit pas lever
        # ValueError sur response.text et faire planter la requete. On renvoie
        # un message degrade clair ; le pipeline RAG retombera ensuite sur le
        # fallback search (CHATBOT_FALLBACK_TO_SEARCH).
        try:
            text = response.text
        except (ValueError, AttributeError):
            text = ""
        if not (text or "").strip():
            logger.warning(
                "Gemini a renvoye une reponse vide (finish_reason probablement SAFETY) "
                "pour le prompt demande. Retour d'un message degrade."
            )
            text = "Je n'ai pas pu generer une reponse pour le moment. Reessayez ou reformulez votre question."
        return text

    def embed_text(self, text: str) -> List[float]:
        try:
            result = self._genai.embed_content(
                model="text-embedding-004",
                content=text,
            )
            return list(result["embedding"])
        except Exception:
            logger.warning("Embed Gemini echoue, utilisation fallback md5")
            return MockLLMProvider().embed_text(text)

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def supports_vision(self) -> bool:
        return "pro" in self._model_name or "flash" in self._model_name


# ---------------------------------------------------------------------------
# Provider OpenAI
# ---------------------------------------------------------------------------


class OpenAIProvider(LLMProvider, EmbeddingProvider):
    """Provider OpenAI via le SDK openai.

    Necessite :
        pip install openai

    La cle API peut etre fournie via api_key= ou lue depuis
    settings.OPENAI_API_KEY / variable d'environnement OPENAI_API_KEY.
    """

    def __init__(
        self,
        model_name: str = "gpt-4o-mini",
        api_key: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        self._model_name = model_name
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self._api_key:
            self._api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not self._api_key:
            raise ImproperlyConfigured(
                "OpenAIProvider requiert une cle API. Fournissez api_key= "
                "ou definissez OPENAI_API_KEY dans l'environnement."
            )
        try:
            import openai  # type: ignore
            self._client = openai.OpenAI(api_key=self._api_key)
        except ImportError:
            raise ImproperlyConfigured(
                "Le package openai n'est pas installe."
                " Installez-le avec : pip install openai."
            )

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> str:
        _rate_limit_guard()
        messages: List[Dict[str, str]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        kwargs: Dict[str, Any] = {
            "model": self._model_name,
            "messages": messages,
        }
        if temperature is not None:
            kwargs["temperature"] = temperature
        if max_tokens is not None:
            kwargs["max_tokens"] = max_tokens
        if timeout is not None:
            # Le SDK openai>=1.0 accepte un timeout par appel (surcharge le
            # timeout par defaut du client).
            kwargs["timeout"] = timeout
        response = self._client.chat.completions.create(**kwargs)
        return response.choices[0].message.content.strip()

    def embed_text(self, text: str) -> List[float]:
        try:
            result = self._client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return list(result.data[0].embedding)
        except Exception:
            logger.warning("Embed OpenAI echoue, utilisation fallback md5")
            return MockLLMProvider().embed_text(text)

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def supports_vision(self) -> bool:
        return self._model_name.startswith("gpt-4o")


# ---------------------------------------------------------------------------
# Provider Ollama (local)
# ---------------------------------------------------------------------------


class OllamaProvider(LLMProvider, EmbeddingProvider):
    """Provider Ollama pour un LLM Local (sans cle API).

    Necessite :
        pip install ollama

    Ollama doit etre demarre sur la machine (serveur ollama).
    Le modele doit etre telecharge : ollama pull llama3
    """

    def __init__(
        self,
        model_name: str = "llama3",
        base_url: Optional[str] = None,
        **kwargs: Any,
    ) -> None:
        self._model_name = model_name
        self._base_url = base_url or getattr(
            settings, "OLLAMA_BASE_URL", "http://localhost:11434"
        )
        try:
            import ollama  # type: ignore
            self._client = ollama.Client(host=self._base_url)
        except ImportError:
            raise ImproperlyConfigured(
                "Le package ollama n'est pas installe."
                " Installez-le avec : pip install ollama."
            )

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> str:
        # NB: le timeout n'est pas cable ici — le client python `ollama` ne
        # supporte un timeout que par instance (a la construction), pas par
        # appel. Risque moindre en pratique : Ollama tourne generalement en
        # local/LAN (latence faible, pas de dependance a un tiers externe),
        # contrairement a Gemini/OpenAI. A revoir si Ollama est utilise
        # derriere un reseau instable.
        _rate_limit_guard()
        messages: List[Dict[str, Any]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        options: Dict[str, Any] = {}
        if temperature is not None:
            options["temperature"] = temperature
        if max_tokens is not None:
            options["num_predict"] = max_tokens
        response = self._client.chat(
            model=self._model_name,
            messages=messages,
            options=options,
        )
        return response["message"]["content"].strip()

    def embed_text(self, text: str) -> List[float]:
        try:
            result = self._client.embeddings(model="mxbai-embed-large", prompt=text)
            return list(result["embedding"])
        except Exception:
            logger.warning("Embed Ollama echoue, utilisation fallback md5")
            return MockLLMProvider().embed_text(text)

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def supports_vision(self) -> bool:
        return False


# ---------------------------------------------------------------------------
# Factory unifiee
# ---------------------------------------------------------------------------


def get_llm_provider(
    name: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    **kwargs: Any,
) -> Optional[LLMProvider]:
    """Factory unifiee qui retourne le bon provider LLM.

    Args:
        name: "gemini" | "openai" | "ollama" | "mock" | "none"
              (si None, lit CHATBOT_PROVIDER depuis Django settings)
        api_key: cle API optionnelle (prioritaire sur l'env)
        model_name: nom de modele optionnel

    Returns:
        Une instance LLMProvider, ou None si name == "none".
    """
    if name is None:
        name = getattr(settings, "CHATBOT_PROVIDER", "none")
    name = (name or "none").strip().lower()
    if model_name is None:
        model_name = getattr(settings, "CHATBOT_MODEL", None)

    if name == "none":
        logger.info("CHATBOT_PROVIDER=none: aucun LLM configure")
        return None

    cache_key = f"{name}:{model_name}:{bool(api_key)}"
    if cache_key in _provider_cache:
        return _provider_cache[cache_key]

    provider: Optional[LLMProvider] = None

    if name == "mock":
        provider = MockLLMProvider(model_name=model_name or "mock-gpt")

    elif name == "gemini":
        try:
            provider = GeminiProvider(
                model_name=model_name or "gemini-1.5-flash",
                api_key=api_key,
                **kwargs,
            )
        except ImproperlyConfigured:
            if api_key or os.environ.get("GOOGLE_API_KEY"):
                raise
            logger.warning(
                "Gemini demande mais GOOGLE_API_KEY absent. Fallback vers MockLLMProvider."
            )
            provider = MockLLMProvider()

    elif name == "openai":
        try:
            provider = OpenAIProvider(
                model_name=model_name or "gpt-4o-mini",
                api_key=api_key,
                **kwargs,
            )
        except ImproperlyConfigured:
            if api_key or os.environ.get("OPENAI_API_KEY"):
                raise
            logger.warning(
                "OpenAI demande mais OPENAI_API_KEY absent. Fallback vers MockLLMProvider."
            )
            provider = MockLLMProvider()

    elif name == "ollama":
        provider = OllamaProvider(
            model_name=model_name or "llama3",
            **kwargs,
        )
    else:
        raise ImproperlyConfigured(
            f"Provider LLM inconnu: {name}. "
            "Providers valides: gemini, openai, ollama, mock, none"
        )

    _provider_cache[cache_key] = provider
    return provider


# Alias historique
def get_provider(
    name: Optional[str] = None,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    **kwargs: Any,
) -> Optional[LLMProvider]:
    """Alias historique pour get_llm_provider."""
    return get_llm_provider(name=name, api_key=api_key, model_name=model_name, **kwargs)


# ---------------------------------------------------------------------------
# Fonctions utilitaires RAG
# ---------------------------------------------------------------------------


def build_rag_prompt(
    question: str,
    context: str,
    system_prompt: Optional[str] = None,
) -> Tuple[str, str]:
    """Construit le prompt RAG a partir de la question et du contexte.

    Args:
        question: la question utilisateur
        context: fragments de documents recuperes
        system_prompt: instruction systeme optionnelle

    Returns:
        Tuple (prompt_complet, system_instruction)
    """
    default_system = getattr(
        settings,
        "CHATBOT_SYSTEM_PROMPT",
        "Tu es OnePortal AI, l'assistant CAMTEL. Repons en francais, "
        "de façon concise et exacte, uniquement a partir du contexte fourni. "
        "Si tu ne connais pas la reponse, dis-le clairement.",
    )
    system = system_prompt or default_system

    if not context.strip():
        prompt = (
            f"Question du client: {question}\n\n"
            "Aucun document de reference n'a ete trouve. "
            "Reponds poliment que tu ne disposes pas d'information "
            "fiable et invite a contacter le support."
        )
    else:
        prompt = (
            "Contexte CAMTEL (extraits de FAQ et produits):\n"
            f"--- DEBUT CONTEXTE ---\n{context}\n--- FIN CONTEXTE ---\n\n"
            f"Question du client: {question}\n\n"
            "Reponds en te basant exclusivement sur le contexte. "
            "Ne fabrique pas d'informations. "
            "Cite les sources quand c'est pertinent."
        )
    return prompt, system


def run_rag_pipeline(
    question: str,
    documents: List[str],
    provider_name: Optional[str] = None,
    api_key: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    timeout: Optional[float] = None,
) -> Dict[str, Any]:
    """Execute le pipeline RAG complet : retrieval + generation LLM.

    Args:
        question: question utilisateur
        documents: liste de fragments de texte (FAQ, description produits)
        provider_name: nom du provider (gemini/openai/ollama/mock)
        api_key: cle API optionnelle
        temperature: temperature LLM
        max_tokens: token max
        timeout: delai maximum (secondes) avant abandon de l'appel LLM

    Returns:
        Dict: answer, provider, model, sources, confidence
    """
    provider = get_llm_provider(
        name=provider_name,
        api_key=api_key,
    )

    if provider is None:
        matched = [d for d in documents if question.lower() in d.lower()]
        if matched:
            return {
                "answer": matched[0][:500],
                "provider": "none",
                "model": "fallback-search",
                "sources": ["text-search"],
                "confidence": 0.3,
            }
        return {
            "answer": (
                "Je ne dispose pas d'information fiable a ce sujet. "
                "Veuillez contacter notre support via le formulaire de contact."
            ),
            "provider": "none",
            "model": "fallback-none",
            "sources": [],
            "confidence": 0.0,
        }

    context = "\n\n".join(doc[:1000] for doc in documents[:5])
    prompt, system_instruction = build_rag_prompt(question, context)
    temp = temperature or getattr(settings, "CHATBOT_TEMPERATURE", 0.3)
    max_tok = max_tokens or getattr(settings, "CHATBOT_MAX_TOKENS", 512)

    try:
        answer = _call_with_hard_timeout(
            provider.generate_content,
            timeout if timeout is not None else getattr(settings, "CHATBOT_TIMEOUT_SECONDS", 20),
            prompt=prompt,
            system_instruction=system_instruction,
            temperature=temp,
            max_tokens=max_tok,
            timeout=timeout if timeout is not None else getattr(settings, "CHATBOT_TIMEOUT_SECONDS", 20),
        )
    except Exception as exc:
        logger.error("LLM generation failed: %s", exc)
        return {
            "answer": (
                "Je ne dispose pas d'information fiable a ce sujet. "
                "Veuillez contacter notre support via le formulaire de contact."
            ),
            "provider": provider_name or "inconnu",
            "model": provider.model_name,
            "sources": [],
            "confidence": 0.0,
            "error": str(exc),
        }

    return {
        "answer": answer,
        "provider": provider_name or "inconnu",
        "model": provider.model_name,
        "sources": [f"doc-{i}" for i in range(len(documents))],
        "confidence": 0.9 if answer else 0.0,
    }