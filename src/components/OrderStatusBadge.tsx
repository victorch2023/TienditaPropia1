import type { OrderStatus } from '../types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente_pago: 'bg-yellow-100 text-yellow-800',
  pagado: 'bg-green-100 text-green-800',
  en_preparacion: 'bg-blue-100 text-blue-800',
  enviado: 'bg-indigo-100 text-indigo-800',
  entregado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export { STATUS_LABELS }
