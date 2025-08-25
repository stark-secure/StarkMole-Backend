import { SetMetadata } from "@nestjs/common"

export const TRANSLATION_KEY = "translation_key"
export const TRANSLATION_NAMESPACE = "translation_namespace"

export const TranslationKey = (key: string) => SetMetadata(TRANSLATION_KEY, key)
export const TranslationNamespace = (namespace: string) => SetMetadata(TRANSLATION_NAMESPACE, namespace)
