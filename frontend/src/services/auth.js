// Serviço de autenticação para integração com backend FastAPI
export async function login(email, password) {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao autenticar');
  }
  return response.json();
}
