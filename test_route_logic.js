require('dotenv').config({ path: '.env.local' });

async function testApiLogic() {
  const GATEWAY = "https://gateway.isolarcloud.com.hk";
  const appKey = process.env.ISOLARCLOUD_APP_KEY;
  const secretKey = process.env.ISOLARCLOUD_SECRET_KEY;
  const userAccount = process.env.ISOLARCLOUD_USER;
  const userPassword = process.env.ISOLARCLOUD_PASSWORD;
  
  console.log("Creds:", { appKey, secretKey, userAccount, userPassword });

  try {
    const loginRes = await fetch(`${GATEWAY}/openapi/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
      body: JSON.stringify({ appkey: appKey, user_account: userAccount, user_password: userPassword })
    });
    const loginData = await loginRes.json();
    console.log("Login data:", loginData);
    
    const token = loginData.result_data?.token;
    if (!token) throw new Error("Token não retornado");

    const stationRes = await fetch(`${GATEWAY}/openapi/getPowerStationList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'sys_code': '901', 'x-access-key': secretKey },
      body: JSON.stringify({ appkey: appKey, token: token, curPage: 1, size: 5 })
    });
    const stationData = await stationRes.json();
    console.log("Station data:", stationData);

  } catch (err) {
    console.error("Error:", err);
  }
}

testApiLogic();
