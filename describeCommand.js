import axios from 'axios';
import FormData from 'form-data';

const describeCommand = async (interaction) => {
    await interaction.deferReply();

    try {
        const imageAttachment = interaction.options.getAttachment('image'); // For uploaded image
        const imageUrl = interaction.options.getString('image_url'); // For image URL

        const formData = new FormData();
        if (imageAttachment) {
            const imageResponse = await axios.get(imageAttachment.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data, 'binary');
            formData.append('image', buffer, {
                filename: imageAttachment.name,
                contentType: imageAttachment.contentType,
            });
        } else if (imageUrl) {
            formData.append('image', imageUrl);
        }

        const describeResponse = await axios.post('http://127.0.0.1:8888/v1/tools/describe-image', formData, {
            headers: {
                ...formData.getHeaders(),
                'accept': 'application/json'
            }
        });

        const description = describeResponse.data.describe;
        await interaction.editReply(`Image description: ${description}`);
    } catch (error) {
        console.error('Error in image description:', error);
        await interaction.editReply('Failed to describe the image.');
    }
};

export default describeCommand;