import { apiClient } from "@/services/apiClient";

export interface OrderItemPayload {
  variant_id: string;
  quantity: number;
}

export interface OrderPayload {
  items: OrderItemPayload[];
  shipping_address: string;
}

export const orderService = {
  async createOrder(payload: OrderPayload) {
    const response = await apiClient.post("/orders/", payload);
    return response.data;
  },
};