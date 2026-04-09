let itensNota = [];

// ================= UTIL =================
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
        base: getTagText(icmsChild, "vBC"),
        valor: getTagText(icmsChild, "vICMS")
    };
}

function extrairPIS(pisNode) {
    if (!pisNode) return {};
    const child = pisNode.children[0];
    return {
        cst: getTagText(child, "CST"),
        aliquota: getTagText(child, "pPIS"),
        base: getTagText(child, "vBC"),
        valor: getTagText(child, "vPIS")
    };
}

function extrairCOFINS(cofNode) {
    if (!cofNode) return {};
    const child = cofNode.children[0];
    return {
        cst: getTagText(child, "CST"),
        aliquota: getTagText(child, "pCOFINS"),
        base: getTagText(child, "vBC"),
        valor: getTagText(child, "vCOFINS")
    };
}

function extrairIPI(ipiNode) {
    if (!ipiNode) return {};
    const child = ipiNode.children[0];
    return {
        cst: getTagText(child, "CST"),
        aliquota: getTagText(child, "pIPI"),
        base: getTagText(child, "vBC"),
        valor: getTagText(child, "vIPI")
    };
}

// ================= LEITURA XML =================
function lerXML() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) { alert("Selecione um XML"); return; }

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

            const descricao = getTagText(prod, "xProd");
            const cfop = getTagText(prod, "CFOP");
            const valor = getTagText(prod, "vProd");

            const icms = extrairICMS(imposto);
            const pis = extrairPIS(imposto.getElementsByTagName("PIS")[0]);
            const cofins = extrairCOFINS(imposto.getElementsByTagName("COFINS")[0]);
            const ipi = extrairIPI(imposto.getElementsByTagName("IPI")[0]);

            itensNota.push({ descricao, cfop, valor, icms, pis, cofins, ipi });

            tabela.innerHTML += `
                <tr>
                    <td>${descricao}</td>
                    <td>${formatarCFOP(cfop)}</td>
                    <td>${icms.cst || "-"}</td>
                    <td>${icms.aliquota || "0"}%</td>
                    <td>${icms.base || "0"}</td>
                    <td>${icms.valor || "0"}</td>

                    <td>${pis.cst || "-"}</td>
                    <td>${pis.aliquota || "0"}%</td>
                    <td>${pis.base || "0"}</td>
                    <td>${pis.valor || "0"}</td>

                    <td>${cofins.cst || "-"}</td>
                    <td>${cofins.aliquota || "0"}%</td>
                    <td>${cofins.base || "0"}</td>
                    <td>${cofins.valor || "0"}</td>

                    <td>${ipi.cst || "-"}</td>
                    <td>${ipi.aliquota || "0"}%</td>
                    <td>${ipi.base || "0"}</td>
                    <td>${ipi.valor || "0"}</td>

                    <td>${valor}</td>
                </tr>
            `;
        }

        document.getElementById("resultado").classList.remove("hidden");
    };

    reader.readAsText(file);
}

// ================= CONVERSÃO COM REGRAS =================
function gerarDevolucao() {
    const regime = document.getElementById("regime").value;
    if (!regime) { alert("Selecione o regime tributário antes de gerar a devolução."); return; }

    const tabela = document.getElementById("tabelaDevolucao");
    tabela.innerHTML = "";

    itensNota.forEach(item => {
        let cfopSaida = item.cfop.startsWith("1") ? "1202" : "2202";

        // ===== ICMS =====
        let cstICMS = (regime === "simples") ? "900" : (item.icms.cst || "-");
        let aliqICMS = item.icms.aliquota || "0";
        let baseICMS = item.icms.base || "0";
        let valorICMS = item.icms.valor || "0";

        // ===== PIS =====
        let cstPIS;
        if (regime === "simples") {
            cstPIS = "49";
        } else {
            cstPIS = (parseFloat(item.pis.valor) > 0 && parseFloat(item.pis.aliquota) > 0)
                ? item.pis.cst || "01"
                : "49";
        }
        let aliqPIS = item.pis.aliquota || "0";
        let basePIS = item.pis.base || "0";
        let valorPIS = item.pis.valor || "0";

        // ===== COFINS =====
        let cstCOFINS;
        if (regime === "simples") {
            cstCOFINS = "49";
        } else {
            cstCOFINS = (parseFloat(item.cofins.valor) > 0 && parseFloat(item.cofins.aliquota) > 0)
                ? item.cofins.cst || "01"
                : "49";
        }
        let aliqCOFINS = item.cofins.aliquota || "0";
        let baseCOFINS = item.cofins.base || "0";
        let valorCOFINS = item.cofins.valor || "0";

        // ===== IPI =====
        let cstIPI = item.ipi.cst || "-";
        let aliqIPI = item.ipi.aliquota || "0";
        let baseIPI = item.ipi.base || "0";
        let valorIPI = item.ipi.valor || "0";

        tabela.innerHTML += `
            <tr>
                <td>${item.descricao}</td>
                <td>${formatarCFOP(cfopSaida)}</td>

                <td>${cstICMS}</td>
                <td>${aliqICMS}%</td>
                <td>${baseICMS}</td>
                <td>${valorICMS}</td>

                <td>${cstPIS}</td>
                <td>${aliqPIS}%</td>
                <td>${basePIS}</td>
                <td>${valorPIS}</td>

                <td>${cstCOFINS}</td>
                <td>${aliqCOFINS}%</td>
                <td>${baseCOFINS}</td>
                <td>${valorCOFINS}</td>

                <td>${cstIPI}</td>
                <td>${aliqIPI}%</td>
                <td>${baseIPI}</td>
                <td>${valorIPI}</td>
            </tr>
        `;
    });

    document.getElementById("devolucao").classList.remove("hidden");
}