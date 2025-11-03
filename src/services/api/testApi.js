import axiosClient from "../axiosClient";

export const testApi = async () => {
  try {
    const response = await axiosClient.get("/test"); // route de test Laravel
    console.log("Réponse API :", response.data);
  } catch (error) {
    console.error("Erreur API :", error);
  }
};
