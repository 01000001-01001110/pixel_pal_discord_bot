// upscaleCommand.js
import axios from 'axios';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { AttachmentBuilder } from 'discord.js';

// upscaleImage function
async function upscaleImage(interaction, imageUrl) {
    // Check if the interaction has already been deferred or replied to
    if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
    }

    const formData = new FormData();
    // Ensure imageUrl is a valid HTTP URL
    if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        formData.append('input_image', buffer, { filename: 'image.jpg' });
    } else {
        // If imageUrl isn't valid, inform the user and stop further processing
        await interaction.followUp({ content: 'Invalid image input. Please provide a valid image URL.', ephemeral: true });
        return;
    }

    // API parameters
    formData.append('uov_method', 'Upscale (2x)');
    formData.append('upscale_value', '2');
    formData.append('performance_selection', 'Speed');
    formData.append('aspect_ratios_selection', '1152*896');
    formData.append('image_number', '1');
    formData.append('sharpness', '2');
    formData.append('guidance_scale', '4');
    formData.append('base_model_name', 'juggernautXL_version6Rundiffusion.safetensors');
    formData.append('refiner_model_name', 'None');
    formData.append('refiner_switch', '0.5');
    formData.append('loras', JSON.stringify([{ "model_name": "sd_xl_offset_example-lora_1.0.safetensors", "weight": 0.1 }]));
    formData.append('advanced_params', ''); // Adjust as needed
    formData.append('async_process', 'false');

    try {
        const upscaleResponse = await axios.post('http://127.0.0.1:8888/v1/generation/image-upscale-vary', formData, {
            headers: { ...formData.getHeaders(), 'Accept': 'application/json' },
        });

        if (upscaleResponse.data && upscaleResponse.data[0] && upscaleResponse.data[0].url) {
            const imageResponse = await fetch(upscaleResponse.data[0].url);
            const imageBuffer = await imageResponse.buffer();
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'upscaled-image.png' });

            // If interaction was deferred but not yet replied, use editReply. Otherwise, use followUp.
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({ content: 'Here is your upscaled image:', files: [attachment] });
            } else {
                await interaction.followUp({ content: 'Here is your upscaled image:', files: [attachment] });
            }
        } else {
            await interaction.followUp('Failed to upscale the image. Please check the input or try again later.');
        }
    } catch (error) {
        console.error('Error upscaling image:', error);
        await interaction.followUp('Failed to upscale the image due to an error.');
    }
}

export { upscaleImage };