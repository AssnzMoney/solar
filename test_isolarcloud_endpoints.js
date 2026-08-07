const appKey = "89D297E2E3BF51CAD788C4AEA629E3E1";
const secretKey = "pdyvemae78faiwc73gpux8b5mssibkua";
const userAccount = "rafael@hcgrupo.com.br";
const userPassword = "634629Gk";

const gateway = "https://gateway.isolarcloud.com.hk";

async function testEndpoints() {
  // 1. LOGIN
  console.log("1. Fazendo Login...");
  const loginRes = await fetch(`${gateway}/openapi/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
    body: JSON.stringify({ appkey: appKey, user_account: userAccount, user_password: userPassword })
  });
  const loginData = await loginRes.json();
  const token = loginData.result_data.token;
  console.log("Token obtido:", token);

  // 2. GET POWER STATION LIST
  console.log("\n2. Buscando Lista de Usinas...");
  const stationRes = await fetch(`${gateway}/openapi/getPowerStationList`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
    body: JSON.stringify({ appkey: appKey, token: token, curPage: 1, size: 10 })
  });
  const stationData = await stationRes.json();
  console.log(JSON.stringify(stationData, null, 2));

  // 3. SE TIVER USINAS, BUSCAR DADOS DE INVERSOR DA PRIMEIRA USINA
  if (stationData.result_data && stationData.result_data.pageList && stationData.result_data.pageList.length > 0) {
    const ps_id = stationData.result_data.pageList[0].ps_id;
    console.log(`\n3. Buscando Dados do Inversor da Usina (ps_id: ${ps_id})...`);
    const inverterRes = await fetch(`${gateway}/openapi/getPVInverterRealTimeData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
      body: JSON.stringify({ appkey: appKey, token: token, ps_key_list: [ps_id.toString()] })
    });
    const inverterData = await inverterRes.json();
    console.log(JSON.stringify(inverterData, null, 2));
  }
}

testEndpoints().catch(console.error);
