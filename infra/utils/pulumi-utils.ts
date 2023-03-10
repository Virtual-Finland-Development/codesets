import { Output } from '@pulumi/pulumi';

export function getValue<T>(output: Output<T>) {
    return new Promise<T>((resolve) => {
        output.apply((value) => {
            resolve(value);
        });
    });
}
