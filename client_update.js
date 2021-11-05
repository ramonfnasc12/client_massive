const accountName = "Conta VTEX";
const VtexIdclientAutCookie = "Adicionar Cookie"

const axios = require('axios');
const instance = axios.create({
    headers: {
        VtexIdclientAutCookie,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})
const array = [];
const csv = require('csv-parser');
const fs = require('fs');
(async () => {
    await new Promise((resolve, reject) => {
        fs.createReadStream('Arquivo CSV conforme exemplo') //Importante manter uma primeira coluna vazia (ex.: Nada)
            .pipe(csv({
                delimiter: ",",
                trim: true
            }))
            .on('data', (row) => {
                const start = row.regime_start.split("/")
                const end = row.regime_end.split("/")
                row.regime_start = start[0] ? `${start[2]}-${start[1]}-${start[0]}` : null
                row.regime_end = end[0] ? `${end[2]}-${end[1]}-${end[0]}` : null
                array.push(row)
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve();
            });
    })
    let i = 0;
    for await (const row of array) {
        await process(row)
        console.log(i);
        i++;
    }
})();

async function process(row) {
    try {
        const { data } = await instance.get(`https://${accountName}.myvtex.com/api/dataentities/CL/search?_fields=id&_where=QADCustomerId=${row.QADCustomerId}`);

        if (!data) return;

        for (const client of data) {
            await instance.patch(`https://${accountName}.myvtex.com/api/dataentities/CL/documents/${client.id}`, {
                "uf_destiny": row.uf_destiny,
                "taxpayer": row.taxpayer==="yes" ? true : false,
                "special_regime": row.special_regime ==="yes" ? true : false,
                "regime_start": row.regime_start,
                "regime_end": row.regime_end
            });
            console.log(client.id)
        }
    }
    catch (e) {
        console.error(e)
    }
}
