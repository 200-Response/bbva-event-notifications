const initialMessageBodySchema = {
	"blocks": [
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":ladybug: *Alerts*"
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
                "text": "*TPV_id:*"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Ubicación:*"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Detalles:* "
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Mensaje:* "
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Fecha:* 2021-08-04T21:23:34Z34"
            }
        }
    ]
};

module.exports = {
    initialMessageBodySchema
};