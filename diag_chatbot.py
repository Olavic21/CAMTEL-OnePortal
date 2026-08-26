import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from apps.core.providers import get_llm_provider
from apps.core.chatbot_service import _collect_context, ask_chatbot

try:
    docs = _collect_context('Quelles offres internet fibre propose Camtel ?')
    print('Context documents found:', len(docs))
    for d in docs[:3]:
        print('  DOC:', d[:100])
    result = ask_chatbot('Quelles offres internet fibre propose Camtel ?')
    print('SOURCE:', result.get('source'))
    print('ANSWER:', result.get('answer', '')[:200])
    print('MODEL:', result.get('model'))
except Exception as e:
    import traceback
    traceback.print_exc()
    print('ERROR:', type(e).__name__, str(e)[:500])