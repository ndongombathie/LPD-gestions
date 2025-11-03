import axios from 'axios';

export const instance = axios.create(
    {
        baseURL:"http://localhost:8000/api",
        timeout:10000,
        headers:{
            Accept:'application/json'
        }

    }
)

instance.interceptors.request.use((config)=>{
    const token=localStorage.getItem('token');
    if(token)
    {
        config.headers.Authorization=`Bearer ${token}`;
    }
    return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expirée. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);