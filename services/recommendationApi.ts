interface ApiResponse<T> {
  data?: T;
  message: string;
  error?: string;
}

interface RecommendationStatusResponse {
  message: string;
  recommendation_id: number;
  is_saved?: boolean;
  is_viewed?: boolean;
}

class RecommendationApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Token d'authentification manquant");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erreur HTTP ${response.status}`);
    }

    return response.json();
  }

  // Mark recommendation as viewed
  async markAsViewed(listingId: number): Promise<RecommendationStatusResponse> {
    return this.makeRequest<RecommendationStatusResponse>(
      `/recommendations/${listingId}/view`,
      { method: 'POST' }
    );
  }

  // Save recommendation
  async saveRecommendation(listingId: number): Promise<RecommendationStatusResponse> {
    return this.makeRequest<RecommendationStatusResponse>(
      `/recommendations/${listingId}/save`,
      { method: 'POST' }
    );
  }

  // Unsave recommendation
  async unsaveRecommendation(listingId: number): Promise<RecommendationStatusResponse> {
    return this.makeRequest<RecommendationStatusResponse>(
      `/recommendations/${listingId}/save`,
      { method: 'DELETE' }
    );
  }

  // Update recommendation status (both saved and viewed)
  async updateRecommendationStatus(
    listingId: number, 
    updates: { is_saved?: boolean; is_viewed?: boolean }
  ): Promise<RecommendationStatusResponse> {
    return this.makeRequest<RecommendationStatusResponse>(
      `/recommendations/${listingId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  }

  // Get recommendation status
  async getRecommendationStatus(listingId: number): Promise<{
    is_saved: boolean;
    is_viewed: boolean;
    listing_id: number;
    user_id: number;
  }> {
    return this.makeRequest(
      `/recommendations/${listingId}/status`,
      { method: 'GET' }
    );
  }
}

// Create singleton instance
export const recommendationApi = new RecommendationApiService();

