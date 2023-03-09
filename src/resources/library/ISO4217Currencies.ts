import { json } from "@iso4217/json";

export default json["$data"][0]["$data"].map((blob: any) => {
    const blobData = blob["$data"];
    const name = blobData.find((item: any) => item["$name"] === "CcyNm")?.["$data"] ?? "";
    const code = blobData.find((item: any) => item["$name"] === "Ccy")?.["$data"] ?? "";
    const country = blobData.find((item: any) => item["$name"] === "CtryNm")?.["$data"] ?? "";
    return {
        id: code,
        name,
        code,
        country
    }
});