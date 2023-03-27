const $$ = (id) => document.getElementById(id);
//Nodes for the HTML elements
const homePage = $$("homePage");
const toExcelPage = $$("toExcelPage");
const fromExcelPage = $$("fromExcelPage");

const jsonViewerContainer = $$("jsonViewerContainer");
const queryViewerContainer = $$("queryViewerContainer");

const jsonViewer = $$("jsonViewer");
const queryViewer = $$("queryViewer");

const selectedInput = $$("file");
const optionsInput = $$("options");
const tableNameInput = $$("tableName");
const sendExcelButton = $$("sendExcel");

const fileInputContainer = $$("fileInputContainer");
const tableNameCOntainer = $$("tableNameContainer");

const copyJSONButton = $$("copyJSONButton");
const copySQLButton = $$("copyQueryButton");

const optionsToExcel = $$("optionsToExcel");
const jsonInput = $$("jsonInput");
const excelGenerateButton = $$("excelGenerateButton");
const formtoExcelValidator = $$("formtoExcelValidator");

// Event listeners
sendExcelButton.addEventListener("click", convertExcelToJSON);
copyJSONButton.addEventListener("click", () => copyToClipboard(copyJSONButton, jsonViewer));
copySQLButton.addEventListener("click", () => copyToClipboard(copySQLButton, queryViewer));

optionsInput.addEventListener("change", (e) => {
	if (fileInputContainer.classList.contains("hidden")) {
		fileInputContainer.classList.remove("hidden");
		fileInputContainer.classList.add("flex", "flex-col");
	}
	if (!fileInputContainer.hasAttribute("required")) selectedInput.setAttribute("required", true);

	const selectedOption = e.target.value;

	if ((selectedOption === "all" || selectedOption === "query") && tableNameCOntainer.classList.contains("hidden")) {
		tableNameCOntainer.classList.remove("hidden");
		tableNameCOntainer.classList.add("flex", "flex-col");
		tableNameCOntainer.setAttribute("required", true);
	} else if (tableNameCOntainer.hasAttribute("required")) {
		tableNameCOntainer.classList.add("hidden");
		tableNameCOntainer.classList.remove("flex", "flex-col");
		tableNameCOntainer.removeAttribute("required");
	}

	if (sendExcelButton.classList.contains("hidden")) sendExcelButton.classList.remove("hidden");
});

excelGenerateButton.addEventListener("click", (e) => {
	e.preventDefault();
	convertJSONToExcel();
});

window.addEventListener("hashchange", pageNavigator, false);
window.addEventListener("DOMContentLoaded", pageNavigator, false);

// This function is called to manage the navigation
function pageNavigator() {
	const hash = window.location.hash;

	if (hash === "#toExcel") {
		if (toExcelPage.classList.contains("hidden")) {
			toExcelPage.classList.remove("hidden");
			toExcelPage.classList.add("flex", "flex-col", "flex-wrap");
			homePage.classList.add("hidden");
			fromExcelPage.classList.add("hidden");
		}
	} else if (hash === "#fromExcel") {
		if (fromExcelPage.classList.contains("hidden")) {
			fromExcelPage.classList.remove("hidden");
			fromExcelPage.classList.add("flex", "flex-wrap");
			homePage.classList.add("hidden");
			toExcelPage.classList.add("hidden");
		}
	} else if (hash === "#home") {
		history.pushState("", document.title, window.location.pathname);
		location.reload();
	} else {
	}
}

// This function is called when the user clicks the "Convert" button
function convertExcelToJSON() {
	const fileSubmitted = selectedInput.files[0];
	const reader = new FileReader();
	const optionSelected = optionsInput.value;
	const tableName = tableNameInput.value;
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
		if (optionSelected === "all" || optionSelected === "json") {
			copyJSONButton.classList.remove("hidden");
			jsonViewerContainer.classList.add("hidden");
			jsonViewer.classList.add("hljs");
			jsonViewer.innerHTML = JSON.stringify(arrayOfObjects[0], null, 2);
			hljs.highlightElement(jsonViewer);
			if (jsonViewerContainer.classList.contains("hidden")) jsonViewerContainer.classList.remove("hidden");
		}

		// Create the SQL query
		if (optionSelected === "all" || optionSelected === "query") {
			copySQLButton.classList.remove("hidden");
			queryViewerContainer.classList.add("hidden");
			createSQLQueryFromJSON(arrayOfObjects[0], tableName || "table_name");
			if (queryViewerContainer.classList.contains("hidden")) queryViewerContainer.classList.remove("hidden");
		}

		if (optionSelected === "query" && !jsonViewerContainer.classList.contains("hidden")) {
			jsonViewerContainer.classList.add("hidden");
			copyJSONButton.classList.add("hidden");
		}

		if (optionSelected === "json" && !queryViewerContainer.classList.contains("hidden")) {
			queryViewerContainer.classList.add("hidden");
			copySQLButton.classList.add("hidden");
		}
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
				.map((value) => {
					if (typeof value === "number" || typeof value === "boolean") return value;
					return `'${value}'`;
				})
				.join(", ")})`
	).join(", ")};`;

	queryViewer.innerHTML = query;
	hljs.highlightElement(queryViewer);
}

function copyToClipboard(buttonNode, toCopyNode) {
	const clipboard = window.navigator.clipboard;
	const textContent = buttonNode.textContent;

	clipboard.writeText(toCopyNode.textContent).then(
		function () {
			buttonNode.textContent = "Copiado!";
			setTimeout(() => {
				buttonNode.textContent = textContent;
			}, 500);
		},
		function (err) {
			console.error("Async: Could not copy text: ", err);
		}
	);
}

function convertJSONToExcel() {
	const jsonInserted = jsonInput.value;
	const optionSelected = optionsToExcel.value;
	formtoExcelValidator.textContent = "";
	formtoExcelValidator.classList.add("hidden");

	console.log("run");
	if (!jsonInserted || !optionSelected || jsonInserted === "" || optionSelected === "") {
		formtoExcelValidator.classList.remove("hidden");
		formtoExcelValidator.textContent = "Hay campos sin llenar";
		return;
	}

	let jsonData;
	try {
		jsonData = JSON.parse(jsonInserted);
	} catch (e) {
		formtoExcelValidator.classList.remove("hidden");
		formtoExcelValidator.textContent = "El JSON no es válido";
		return;
	}
	let wb, ws;
	if (optionSelected === "csv") {
		console.log("csv");
		const csvData = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(jsonData));
		const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
		// saveAs(blob, "data.csv");
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", "data.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	} else {
		console.log("excel");
		ws = XLSX.utils.json_to_sheet(jsonData);
		wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Hoja 1");
		XLSX.writeFile(wb, "data.xlsx");
	}

	jsonInput.value = "";
}
