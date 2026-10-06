type RequestCountItem = {
  id: string;
  status: string;
  direction?: "sent" | "received";
};

type RequestCountOrder = {
  id?: string;
  swap_request_id?: string | null;
  from_user_id?: string;
  is_checkout_pending?: boolean;
};

export function getRequestNavigationCount(
  requests: RequestCountItem[],
  orders: RequestCountOrder[],
  userId: string,
) {
  const realOrders = orders.filter(
    (order) =>
      order.swap_request_id &&
      !order.is_checkout_pending &&
      !String(order.id || "").startsWith("checkout-"),
  );
  const orderRequestIds = new Set(realOrders.map((order) => order.swap_request_id as string));
  const ownOrderRequestIds = new Set(
    realOrders
      .filter((order) => order.from_user_id === userId)
      .map((order) => order.swap_request_id as string),
  );
  const isCheckoutRequest = (request: RequestCountItem) =>
    orderRequestIds.has(request.id) || request.status === "accepted" || request.status === "completed";

  const incomingCount = requests.filter(
    (request) =>
      request.direction === "received" &&
      !isCheckoutRequest(request) &&
      request.status !== "completed" &&
      request.status !== "rejected",
  ).length;
  const outgoingCount = requests.filter(
    (request) =>
      request.direction === "sent" &&
      !isCheckoutRequest(request) &&
      request.status !== "completed" &&
      request.status !== "rejected",
  ).length;
  const checkoutCount = requests.filter((request) => {
    if (!isCheckoutRequest(request)) return false;
    const hasOwnOrder = ownOrderRequestIds.has(request.id);
    const hasPartnerOrder = realOrders.some(
      (order) => order.swap_request_id === request.id && order.from_user_id !== userId,
    );
    return !(hasOwnOrder && hasPartnerOrder);
  }).length;

  return incomingCount + outgoingCount + checkoutCount;
}

