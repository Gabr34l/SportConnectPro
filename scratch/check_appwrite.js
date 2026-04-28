
const { Client, Databases } = require('node-appwrite');

async function checkData() {
  const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69c5aea90031eb496975'); // Project ID from .env

  const databases = new Databases(client);
  const databaseId = '69c5b0690011e05554d2'; // Database ID from .env
  
  try {
    console.log('--- EVENTOS ---');
    const eventos = await databases.listDocuments(databaseId, 'eventos');
    console.log(`Total: ${eventos.total}`);
    eventos.documents.forEach(doc => {
      console.log(`- ${doc.titulo} (${doc.status}) | Data: ${doc.data_evento} | Quadra: ${doc.id_quadra}`);
    });

    console.log('\n--- QUADRAS ---');
    const quadras = await databases.listDocuments(databaseId, 'quadras');
    console.log(`Total: ${quadras.total}`);
    quadras.documents.forEach(doc => {
      console.log(`- ${doc.nome_local} | Lat: ${doc.latitude} | Lon: ${doc.longitude} | Status: ${doc.status_aprovacao}`);
    });
  } catch (e) {
    console.error('Error:', e);
  }
}

checkData();
