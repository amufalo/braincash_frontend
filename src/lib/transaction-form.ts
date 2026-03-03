/**
 * Forma de pagamento: define destino (conta ou cartão) e se já vem marcado como pago.
 */
export type PaymentMethodId =
  | "dinheiro"
  | "pix"
  | "boleto"
  | "ted_doc"
  | "cartao_debito"
  | "cartao_credito"

export interface PaymentMethodOption {
  id: PaymentMethodId
  label: string
  destination: "account" | "card"
  isPaidByDefault: boolean
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: "dinheiro", label: "Dinheiro", destination: "account", isPaidByDefault: true },
  { id: "pix", label: "PIX", destination: "account", isPaidByDefault: true },
  { id: "boleto", label: "Boleto", destination: "account", isPaidByDefault: true },
  { id: "ted_doc", label: "TED/DOC", destination: "account", isPaidByDefault: true },
  { id: "cartao_debito", label: "Cartão de débito", destination: "account", isPaidByDefault: true },
  { id: "cartao_credito", label: "Cartão de crédito", destination: "card", isPaidByDefault: false },
]

/**
 * Condição do lançamento: à vista, parcelado ou recorrente.
 */
export type ConditionId = "a_vista" | "parcelado" | "recorrente"

export interface ConditionOption {
  id: ConditionId
  label: string
  installmentsDefault: number
  showInstallmentsInput: boolean
  showRecurrenceInput: boolean
}

export const CONDITIONS: ConditionOption[] = [
  { id: "a_vista", label: "À vista", installmentsDefault: 1, showInstallmentsInput: false, showRecurrenceInput: false },
  { id: "parcelado", label: "Parcelado", installmentsDefault: 2, showInstallmentsInput: true, showRecurrenceInput: false },
  { id: "recorrente", label: "Recorrente", installmentsDefault: 1, showInstallmentsInput: false, showRecurrenceInput: true },
]
