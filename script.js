let itensNota = [];

function getTagText(node, tag) {
    return node?.getElementsByTagName(tag)[0]?.textContent || "";
}

function formatarCFOP(cfop) {
    if (!cfop || cfop.length !== 4) return cfop;
    return cfop[0] + "." + cfop.substring(1);
}

// ================= IMPOSTOS =================
function extrairICMS(imposto) {
    const icmsNode = imposto.getElementsByTagName("ICMS")[0];
    const icmsChild = icmsNode?.children[0];

    return {
        cst: getTagText(icmsChild, "CST") || getTagText(icmsChild, "CSOSN"),
        aliquota: getTagText(icmsChild, "pICMS"),
        valor: getTagText(icmsChild, "vICMS")
    };
}

function extrairPIS(pisNode) {
    if (!pisNode) return {};
    const child = pisNode.children[0];
    return {
        cst: getTagText(child, "CST"),
        aliquota: getTagText(child, "pPIS"),
        valor: getTagText(child, "vPIS")
    };
}

function extrairCOFINS(cofNode) {
    if (!cofNode) return {};
    const child = cofNode.children[0];
    return {
        cst: getTagText(child, "CST"),
        aliquota: getTagText(child, "pCOFINS"),
        valor: getTagText(child, "vCOFINS")
    };
}

function extrairIPI(ipiNode) {
    if (!ipiNode) return {};
    const child = ipiNode.children[0];
    return {
        cst: getTagText(child, "CST"),
        aliquota: getTagText(child, "pIPI"),
        valor: getTagText(child, "vIPI")
    };
}

// ================= LEITURA XML =================
function lerXML() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return alert("Selecione um XML");

    const reader = new FileReader();

    reader.onload = function(e) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(e.target.result, "text/xml");

        const chave = getTagText(xml, "chNFe");
        const emitente = xml.getElementsByTagName("emit")[0];
        const destinatario = xml.getElementsByTagName("dest")[0];

        document.getElementById("chave").textContent = chave;
        document.getElementById("emitente").textContent = getTagText(emitente, "xNome");
        document.getElementById("destinatario").textContent = getTagText(destinatario, "xNome");

        const dets = xml.getElementsByTagName("det");
        const tabela = document.getElementById("produtos");

        tabela.innerHTML = "";
        itensNota = [];

        for (let i = 0; i < dets.length; i++) {
            const det = dets[i];

            const prod = det.getElementsByTagName("prod")[0];
            const imposto = det.getElementsByTagName("imposto")[0];

            const item = {
                descricao: getTagText(prod, "xProd"),
                cfop: getTagText(prod, "CFOP"),
                valor: getTagText(prod, "vProd"),
                icms: extrairICMS(imposto),
                pis: extrairPIS(imposto.getElementsByTagName("PIS")[0]),
                cofins: extrairCOFINS(imposto.getElementsByTagName("COFINS")[0]),
                ipi: extrairIPI(imposto.getElementsByTagName("IPI")[0])
            };

            itensNota.push(item);

            tabela.innerHTML += `
                <tr>
                    <td>${item.descricao}</td>
                    <td>${formatarCFOP(item.cfop)}</td>

                    <td>${item.icms.cst || "-"}</td>
                    <td>${item.icms.aliquota || "0"}%</td>
                    <td>${item.icms.valor || "0"}</td>

                    <td>${item.pis.cst || "-"}</td>
                    <td>${item.pis.aliquota || "0"}%</td>
                    <td>${item.pis.valor || "0"}</td>

                    <td>${item.cofins.cst || "-"}</td>
                    <td>${item.cofins.aliquota || "0"}%</td>
                    <td>${item.cofins.valor || "0"}</td>

                    <td>${item.ipi.cst || "-"}</td>
                    <td>${item.ipi.aliquota || "0"}%</td>
                    <td>${item.ipi.valor || "0"}</td>

                    <td>${item.valor}</td>
                </tr>
            `;
        }

        document.getElementById("resultado").classList.remove("hidden");
    };

    reader.readAsText(file);
}

// ================= DEVOLUÇÃO =================
function gerarDevolucao() {
    const regime = document.getElementById("regime").value;
    if (!regime) return alert("Selecione o regime tributário");

    const tabela = document.getElementById("tabelaDevolucao");
    tabela.innerHTML = "";

    itensNota.forEach(item => {

        const cfopSaida = item.cfop.startsWith("1") ? "1202" : "2202";

        const cstICMS = (regime === "simples") ? "900" : (item.icms.cst || "-");

        const cstPIS = (regime === "simples")
            ? "49"
            : ((parseFloat(item.pis.valor) > 0 && parseFloat(item.pis.aliquota) > 0)
                ? item.pis.cst || "01"
                : "49");

        const cstCOFINS = (regime === "simples")
            ? "49"
            : ((parseFloat(item.cofins.valor) > 0 && parseFloat(item.cofins.aliquota) > 0)
                ? item.cofins.cst || "01"
                : "49");

        tabela.innerHTML += `
            <tr>
                <td>${item.descricao}</td>
                <td>${formatarCFOP(cfopSaida)}</td>

                <td>${cstICMS}</td>
                <td>${item.icms.aliquota || "0"}%</td>
                <td>${item.icms.valor || "0"}</td>

                <td>${cstPIS}</td>
                <td>${item.pis.aliquota || "0"}%</td>
                <td>${item.pis.valor || "0"}</td>

                <td>${cstCOFINS}</td>
                <td>${item.cofins.aliquota || "0"}%</td>
                <td>${item.cofins.valor || "0"}</td>

                <td>${item.ipi.cst || "-"}</td>
                <td>${item.ipi.aliquota || "0"}%</td>
                <td>${item.ipi.valor || "0"}</td>
            </tr>
        `;
    });

    document.getElementById("devolucao").classList.remove("hidden");
}