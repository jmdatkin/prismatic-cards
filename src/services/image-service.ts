import { reportUnusedDisableDirectives } from '.eslintrc.cjs';
import sharp from 'sharp';

const processCardImage = (imageData: string) => {

    try {
        const width = process.env["CARD_IMAGE_RESIZE_WIDTH"];
        const height = process.env["CARD_IMAGE_RESIZE_HEIGHT"];

        if (!width || !height) return;

        const data = Buffer.from(imageData.split(';base64,').pop()!, 'base64');

        const image = sharp(data)
            .resize(parseInt(width), parseInt(height))
            .toFormat('jpeg')
            .jpeg({
                force: true
            })
            .toBuffer();

        return image;

    } catch (e) { throw new Error(`[Sharp] ${e}`) }
};

export { processCardImage };