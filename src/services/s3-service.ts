import { PutObjectRequest, S3 } from "@aws-sdk/client-s3"


const s3 = new S3();

const uploadToS3 = async (keyName: string, imageData: Buffer) => {
    const bucket = process.env["AWS_S3_BUCKET"];

    const params: any = {
        Key: `cards/${keyName}`,
        Bucket: bucket,
        Body: imageData,
        ContentEncoding: 'base64',
        ContentType: `image/jpg`
    };

    let location = '';
    let key = '';

    try {
        const result = await s3.putObject(params);
        location = `https://prismatic-cards-s3.s3.us-east-1.amazonaws.com/cards/${keyName}`
        console.log("[S3] Successfully uploaded at:", location);
        return location;
    } catch (e) {
        throw new Error(JSON.stringify(e));
    }

}

export { uploadToS3 }