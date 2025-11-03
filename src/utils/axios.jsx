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