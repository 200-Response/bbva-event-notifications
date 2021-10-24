const initialMessageBodySchema = {
	"blocks": [
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":ladybug: *Error Logger*"
            }
        },
        {
			"type": "context",
			"elements": [
				{
					"type": "image",
					"image_url": "https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png",
					"alt_text": "error level"
				},
				{
					"type": "mrkdwn",
					"text": "*Prioridad:*"
				}
			]
		},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Cliente:* \n *Tienda:*"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Aplicación:* - *Servicio:* blp-client-meta\n*Archivo:* transactionController.js\n*Función:* startCheckout( )\n*Entrada:* {id:2312qweaewe, orderId:er3442342r}"
            },
			"accessory": {
				"type": "image",
				"image_url": "https://api.slack.com/img/blocks/bkb_template_images/approvalsNewDevice.png",
				"alt_text": "computer thumbnail"
			}
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Mensaje:* The specified key does not exist."
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Entorno:* \n*Fecha:* 2021-08-04T21:23:34Z34"
            }
        }
    ]
};

module.exports = {
    initialMessageBodySchema
};