const uuid = 'f39b11da-2d00-424f-871c-0c9a44243184';
fetch('https://app.solarz.com.br/pages/shareable/usina/' + uuid)
  .then(r => r.text())
  .then(html => {
    const match = html.split('<script id="__NEXT_DATA__" type="application/json">')[1]?.split('</script>')[0];
    if(match) {
      const data = JSON.parse(match);
      console.log(JSON.stringify(data.props.pageProps, null, 2).substring(0, 500));
    } else {
      console.log('No next data found');
    }
  });
