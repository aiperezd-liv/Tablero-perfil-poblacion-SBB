function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Dashboard Ejecutivo de Riesgo 100% Stacked - Suburbia')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0]; 
  
  if (!sheet) {
    throw new Error("No se encontró ninguna pestaña en el archivo.");
  }
  
  var data = sheet.getDataRange().getValues();
  // Limpiamos los encabezados de espacios y los pasamos a minúsculas para un mapeo seguro
  var headers = data[0].map(function(h) { return h.toString().trim().toLowerCase(); });
  
  // Variables estandarizadas requeridas (Mapeadas a minúsculas desde el SQL)
  var targetVariables = [
    "risklevel", "flag_nohit", "flag_femenino", "escolaridad", 
    "score", "edad", "ingreso", "linea_credito_onus", 
    "linea_credito_offus", "utilizacion", "tasa",
    "estado_civil", "vivienda", "pti", "bti", "lti_onus", 
    "lti_tot", "consultas_3m", "consultas_6m", "numero_tarjetas"
  ];
  
  // Columnas estructurales de control
  var idxPeriodo = headers.indexOf("periodo");
  var idxProducto = headers.indexOf("producto");
  var idxModelo = headers.indexOf("modelo"); // <-- NUEVO: Encontrar la columna 'modelo' en la hoja de cálculo
  
  if (idxPeriodo === -1 || idxProducto === -1) {
    throw new Error("Faltan las columnas estructurales 'periodo' o 'producto' en la hoja.");
  }
  
  var varIndices = {};
  targetVariables.forEach(function(v) {
    var idx = headers.indexOf(v);
    if (idx !== -1) {
      varIndices[v] = idx;
    }
  });

  var periodosSet = {};
  var productosSet = {};
  var rawRows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var per = row[idxPeriodo] ? row[idxPeriodo].toString().trim() : null;
    var prod = row[idxProducto] ? row[idxProducto].toString().trim() : null;
    
    // Extracción segura del Modelo. Si no existe la columna o está vacía, se asigna 'Otros/Null'
    var mod = (idxModelo !== -1 && row[idxModelo]) ? row[idxModelo].toString().trim() : "Otros/Null";
    
    if (!per || !prod) continue;
    
    periodosSet[per] = true;
    productosSet[prod] = true;
    
    // Construimos el objeto base incluyendo la nueva variable 'modelo'
    var rowData = { 
      periodo: per, 
      producto: prod,
      modelo: mod 
    };
    
    for (var v in varIndices) {
      var val = row[varIndices[v]];
      // Convertimos los valores a String y blindamos contra celdas vacías o nulas
      rowData[v] = (val !== undefined && val !== null && val !== "") ? val.toString().trim() : "Sin Informacion";
    }
    rawRows.push(rowData);
  }

  return {
    periodos: Object.keys(periodosSet).sort(),
    productos: Object.keys(productosSet).sort(),
    variablesDisponibles: Object.keys(varIndices),
    rawMetrics: rawRows
  };
}
