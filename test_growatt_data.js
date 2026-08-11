require('dotenv').config({ path: '.env.local' });
const token = process.env.GROWATT_TOKEN;

async function test() {
  const listRes = await fetch('https://openapi.growatt.com/v1/plant/list', {headers:{Token: token}});
  const list = await listRes.json();
  const pid = list.data.plants[0].plant_id;
  const date = '2026-08-11';
  const eRes = await fetch(`https://openapi.growatt.com/v1/plant/data?plant_id=${pid}&date=${date}`, {headers:{Token: token}});
  console.log('Growatt data:', JSON.stringify(await eRes.json(), null, 2));
}

test();
