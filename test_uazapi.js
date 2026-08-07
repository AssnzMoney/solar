const token = "03e6289e-50cb-4474-bca3-e03648866e82";
const url = "https://fluxiabr.uazapi.com/send/text";
const phone = "5581998992532";

console.log("Iniciando teste UAZAPI headers...");

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': token,
    'api-key': token,
    'Authorization': `Bearer ${token}`,
    'token': token,
    'Client-Token': token,
    'instance_token': token
  },
  body: JSON.stringify({
    number: phone,
    text: "*[SolarMonitor Teste]*\n\nIsso é um teste."
  })
})
.then(async res => {
  console.log("Status da Resposta:", res.status);
  const text = await res.text();
  console.log("Corpo da Resposta:", text);
})
.catch(err => {
  console.error("Erro Fatal no Fetch:", err);
});
