import { apiClient } from "@/services/apiClient";
import { Product } from "@/types/product";

export const productService = {
  async getProducts(limit: number = 20, offset: number = 0): Promise<Product[]> {
    const response = await apiClient.get<Product[]>("/products/", {
      params: { limit, offset },
    });
    return response.data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${slug}`);
    return response.data;
  },
};