import { json } from '@iso4217/json';

const transformed = json["$data"][0]["$data"].reduce((acc: any, blob: any) => {
  const blobData = blob["$data"];
  const name = blobData.find((item: any) => item["$name"] === "CcyNm")?.["$data"] ?? "";
  const code = blobData.find((item: any) => item["$name"] === "Ccy")?.["$data"] ?? "";
  //const country = blobData.find((item: any) => item["$name"] === "CtryNm")?.["$data"] ?? "";

  if (typeof acc[code] === "undefined") {
    // Pick the first one in the dataset, prevent duplicate ids
    acc[code] = {
      id: code,
      name,
    };
  }
  return acc;
}, {} as Record<string, any>);

export default Object.values(transformed);