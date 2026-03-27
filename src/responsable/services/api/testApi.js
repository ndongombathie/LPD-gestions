import httpClient from '../http/client';

export const testApi = async () => {
  try {
    const response = await httpClient.get("/test");
    console.log("Réponse API :", response.data);
  } catch (error) {
    console.error("Erreur API :", error);
  }
};