const appKey = "89D297E2E3BF51CAD788C4AEA629E3E1";
const secretKey = "pdyvemae78faiwc73gpux8b5mssibkua";
const token = "419547_9m8h3tdte8b1a6gu5uzn7zru26mpdnes0uxjbg1eig5mr99kq64du3ajkx03drpqxt23fvcbi616rap8jfn0465j7dw4ah80575yppa7qr65rvvnmv1q5eduxx5kdpbu"; // Token fresco

const url = "https://gateway.isolarcloud.com.hk/openapi/getPlantList";

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'sys_code': '901',
    'x-access-key': secretKey
  },
  body: JSON.stringify({
    appkey: appKey,
    token: token
  })
})
.then(async res => {
  console.log("Status getPlantList:", res.status);
  const text = await res.text();
  console.log("Resposta:", text);
})
.catch(err => {
  console.error("Erro no fetch:", err);
});
