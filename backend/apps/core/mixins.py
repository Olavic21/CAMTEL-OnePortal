from rest_framework import serializers

from .i18n import get_request_language, localized_value


class TranslatableSerializerMixin:
    """Expose les champs traduits selon Accept-Language."""

    translatable_fields: tuple[str, ...] = ()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        lang = get_request_language(request)
        for field in self.translatable_fields:
            if field in data:
                data[field] = localized_value(instance, field, lang)
        return data


class TranslatableModelSerializer(TranslatableSerializerMixin, serializers.ModelSerializer):
    pass
