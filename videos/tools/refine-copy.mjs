import fs from 'node:fs';
let source=fs.readFileSync('campaign.mjs','utf8');
const replacements={
 'Tenés cosas que comprar. Lugares a donde ir. Y poco tiempo para comparar.':'Tu lista crece. Tenés poco tiempo para comparar.',
 '¿Más rápido? Decí lo que te falta. Revisá los productos y elegí las marcas.':'Decí lo que te falta. Revisá los productos y elegí las marcas.',
 'Compará las opciones. Sin desvíos, intermedio o hipereconómico. Vos decidís cuánto te conviene desviarte.':'Compará hasta tres opciones. Vos elegís cuánto te conviene desviarte para comprar.',
 'Creá tu cuenta o iniciá sesión. Podés usar email, Google, Meta o Discord. También tenés recuperación de contraseña.':'Entrá con email, Google, Meta o Discord. También podés recuperar tu contraseña.',
 'Revisá lo que entendió, elegí las marcas y confirmá. Si preferís, también podés escribir.':'Revisá los productos, elegí marcas y confirmá. También podés escribir.',
 'La administración gestiona solicitudes y novedades. El panel administrativo también permite gestionar comercios y moderar los reportes de precios.':'La administración gestiona solicitudes y novedades. Su panel permite gestionar comercios y moderar reportes de precios.',
 'Tu lista. Tu recorrido. Tu próxima compra. Descargá DePaso y ahorrá en el camino.':'Descargá DePaso. Tu compra, en el camino.'
};
for(const [a,b]of Object.entries(replacements))source=source.replace(a,b);
fs.writeFileSync('campaign.mjs',source);
