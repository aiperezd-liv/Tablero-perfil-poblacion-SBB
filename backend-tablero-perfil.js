function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Dashboard Ejecutivo de Riesgo - Agregación BigQuery - Suburbia')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0]; 
  
  if (!sheet) {
    throw new Error("No se encontró ninguna pestaña en el archivo de Google Sheets.");
  }
  
  var data = sheet.getDataRange().getValues();
  // Limpiamos los encabezados y pasamos a minúsculas
  var headers = data[0].map(function(h) { return h.toString().trim().toLowerCase(); });
  
  // Índices para la estructura agrupada vertical (long-format)
  var idxPeriodo = headers.indexOf("periodo");
  var idxProducto = headers.indexOf("producto");
  var idxModelo = headers.indexOf("modelo");
  var idxVariable = headers.indexOf("variable");
  var idxValor = headers.indexOf("valor_categoria");
  var idxConteo = headers.indexOf("conteo");
  
  if (idxPeriodo === -1 || idxProducto === -1 || idxVariable === -1 || idxValor === -1 || idxConteo === -1) {
    throw new Error("Faltan columnas de la estructura pre-agregada de BigQuery en la hoja (Periodo, Producto, Modelo, Variable, Valor_Categoria o Conteo).");
  }
  
  var periodosSet = {};
  var productosSet = {};
  var variablesSet = {};
  var rawRows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var per = row[idxPeriodo] ? row[idxPeriodo].toString().trim() : null;
    var prod = row[idxProducto] ? row[idxProducto].toString().trim() : null;
    var mod = (idxModelo !== -1 && row[idxModelo]) ? row[idxModelo].toString().trim() : "Otros/Null";
    var v = row[idxVariable] ? row[idxVariable].toString().trim().toLowerCase() : null;
    var val = row[idxValor] ? row[idxValor].toString().trim() : "Sin Informacion";
    var cnt = row[idxConteo] ? parseInt(row[idxConteo], 10) : 0;
    
    if (!per || !prod || !v) continue;
    
    periodosSet[per] = true;
    productosSet[prod] = true;
    variablesSet[v] = true;
    
    rawRows.push({
      periodo: per,
      producto: prod,
      modelo: mod,
      variable: v,
      valor: val,
      conteo: isNaN(cnt) ? 0 : cnt
    });
  }

  return {
    periodos: Object.keys(periodosSet).sort(),
    productos: Object.keys(productosSet).sort(),
    variablesDisponibles: Object.keys(variablesSet),
    rawMetrics: rawRows
  };
}
  
