//Nodes for the HTML elements
const resultNode = document.getElementById("result");

const jsonViewerContainer = document.getElementById("jsonViewerContainer");
const queryViewerContainer = document.getElementById("queryViewerContainer");

const jsonViewer = document.getElementById("jsonViewer");
const queryViewer = document.getElementById("queryViewer");

const selectedInput = document.getElementById("file");
const optionsInput = document.getElementById("options");
const tableNameInput = document.getElementById("tableName");
const sendExcelButton = document.getElementById("sendExcel");

const copyJSONButton = document.getElementById("copyJSONButton");
const copySQLButton = document.getElementById("copyQueryButton");
// Event listeners

sendExcelButton.addEventListener("click", convertExcelToJSON);
copyJSONButton.addEventListener("click", () => copyToClipboard(copyJSONButton, jsonViewer));
copySQLButton.addEventListener("click", () => copyToClipboard(copySQLButton, queryViewer));

// This function is called when the user clicks the "Convert" button
function convertExcelToJSON() {
	const fileSubmitted = selectedInput.files[0];
	const reader = new FileReader();

	reader.onload = function (e) {
		const data = new Uint8Array(e.target.result);
		const workbook = XLSX.read(data, {
			type: "array",
		});
		const arrayOfObjects = workbook.SheetNames.map(function (sheetName) {
			// Here is your object
			const sheet = workbook.Sheets[sheetName];
			const dataJSON = XLSX.utils.sheet_to_json(sheet);

			return dataJSON;
		});

		// Display the result
		jsonViewer.classList.add("hljs");
		hljs.highlightElement(document.querySelector(".json"));
		jsonViewer.innerHTML = JSON.stringify(arrayOfObjects[0], null, 2);

		// Create the SQL query
		createSQLQueryFromJSON(arrayOfObjects[0], "table_name");
	};

	reader.readAsArrayBuffer(fileSubmitted);
}

function downloadJSONFile(jsonData) {
	const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
	const downloadAnchorNode = document.createElement("a");
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", "data.json");
	document.body.appendChild(downloadAnchorNode); // required for firefox

	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

function createSQLQueryFromJSON(JSONData, tableName) {
	const query = `INSERT INTO ${tableName} (${Object.keys(JSONData[0]).join(", ")}) \n VALUES ${JSONData.map(
		(row) =>
			`\n (${Object.values(row)
				.map((value) => `'${value}'`)
				.join(", ")})`
	).join(", ")};`;

	hljs.highlightElement(document.querySelector(".sql"));
	queryViewer.innerHTML = query;
}

function copyToClipboard(buttonNode, toCopyNode) {
	const clipboard = window.navigator.clipboard;

	clipboard.writeText(toCopyNode.textContent).then(
		function () {
			buttonNode.textContent = "Copiado!";
			setTimeout(() => {
				buttonNode.textContent = "Copiar";
			}, 500);
		},
		function (err) {
			console.error("Async: Could not copy text: ", err);
		}
	);
}
