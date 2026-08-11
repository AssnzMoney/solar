require('dotenv').config({ path: '.env.local' });
const token = process.env.GROWATT_TOKEN;

async function test() {
  const listRes = await fetch('https://openapi.growatt.com/v1/plant/list', {headers:{Token: token}});
  const list = await listRes.json();
  const pid = list.data.plants[0].plant_id;
  const monthStart = '2026-08-01';
  const eRes = await fetch(`https://openapi.growatt.com/v1/plant/energy?plant_id=${pid}&start_date=${monthStart}&end_date=2026-08-31&time_unit=month`, {headers:{Token: token}});
  console.log(JSON.stringify(await eRes.json(), null, 2));
}

test();
