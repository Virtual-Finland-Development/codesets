import { Output } from "@pulumi/pulumi";

export function getValue<T>(output: Output<T>) {
    return new Promise<T>((resolve, reject)=>{
        output.apply(value=>{
            resolve(value);
        });
    });
}