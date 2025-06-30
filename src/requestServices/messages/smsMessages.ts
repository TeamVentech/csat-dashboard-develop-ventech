const ratingLink = '\nhttps://cc.ventech.co/rating/{id}'

const SmsMessage = {
	get(type: string, state: string, language: string, vars: Record<string, string> = {}): string | undefined {
		let template = this?.[type]?.[state]?.[language]
		if (!template) return undefined
		Object.entries(vars).forEach(([k, v]) => {
			template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), v.toString())
		})
		return template
	},
	'Lost Child': {
		'Open': {
			'ar': `زبوننا العزيز،\nتم تسجيل حالة فقدان الطفل. فرقنا تقوم بعملية البحث. سنبلغكم بأي جديد.\nنتمنى لكم السلامة`,
			'en': `Dear customer,\nWe would like to inform you that missing child case is open. Our team is on the search. We will keep you updated.\n"Stay Safe" from City Mall`,
		},
		'Child Found': {
			'ar': 'تم العثور على طفلكم المفقود. يرجى التوجه لمكتب خدمة الزبائن في الطابق الأرضي لاستلام الطفل وإبراز هويتكم.',
			'en': 'We would like to inform you that your child was found. Please head immediately to Customer Care desk at Ground Floor to collect child and present your ID.',
		},
		'Closed': {
			'ar': ` تم إغلاق الحالة.\nيرجى تقييم الخدمة من خلال الرابط ${ratingLink}`,
			'en': `We would like to inform you that the case is closed.\nPlease rate our service by following the below link:${ratingLink}`,
		},
	},
	'Found Child': {
		'Awaiting Collection': {
			'ar': 'تم العثور على طفلكم المفقود.\n يرجى التوجه لمكتب خدمة الزبائن في الطابق الأرضي لاستلام الطفل وإبراز هويتكم.',
			'en': 'Dear Customer,\nYour missing child was found. Please head immediately to Customer Care desk at Ground Floor to collect child and present your ID.\n',
		},
		'Closed': {
			'ar': `تم إغلاق الحالة.\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `We would like to inform you that the case is closed.\nPlease rate our service by following the below link:${ratingLink}`,
		},
	},
	'Lost Item': {
		'Open': {
			'ar': 'زبوننا العزيز،\nتم تسجيل حالة فقدان الممتلكات. سنبلغكم بأي جديد.',
			'en': 'Dear customer,\nWe would like to inform you that missing item case is open. We will keep you updated.',
		},
		'Awaiting Collection': {
			'ar': 'زبوننا العزيز،\nتم العثور على المفقود. يرجى زيارة مكتب الأمن في الطابق الأرضي للاستلام',
			'en': 'We would like to inform you that your item is found. Please visit our Security Office at Ground Floor for collection.',
		},
		'Article Found': {
			'ar': `تم إغلاق الحالة\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `The case is closed.\nPlease rate our services by following the below link:\n${ratingLink}`,
		},
		'Article Not Found': {
			'ar': `زبوننا العزيز،\nلم يتم العثور على المفقود. سنبلغكم عند العثور عليه.\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `Dear Customer,\nThe lost item has not been found yet. We will notify you once found.\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
		'In Progress': {
			'ar': 'زبوننا العزيز،\nلم يتم العثور على المفقود بعد. سنبلغكم بأي جديد.',
			'en': 'Dear Customer,\ We would like to inform you that the item has not been found yet. We will keep you updated.',
		},
		'In Progress Day 3': {
			'ar': 'زبوننا العزيز،\n لم يتم العثور على المفقود بعد.\n سنبلغكم عند العثور عليه.',
			'en': 'Dear Customer,\n  We would like to inform you that the item has not been found yet.\n We will inform you when it is found.',
		},
	},
	'Incident Reporting': {
		'Closed': {
			'en': `"Stay safe" from Citymall.\nPlease rate our service by following the below link:\n${ratingLink}`,
			'ar': `نتمنى لكم السلامة.\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
		},
		'Open': {
			'en': `"Stay safe" from Citymall.\nPlease rate our service by following the below link:\n${ratingLink}`,
			'ar': `نتمنى لكم السلامة.\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
		},
	},
	'Suggestion Box': {
		'Pending': {
			'ar': 'زبوننا العزيز،\nتم تسجيل اقتراحكم. شكراً لكم!',
			'en': 'Dear Customer,\nYour suggestion has been registered. Thank you!',
		},
		'Closed': {
			'ar': `تمت معالجة اقتراحكم\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `Your suggestion has been processed.\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
	},
	'Individual Voucher Sale': {
		'Sold': {
			'ar': `شكراً لك. نتمنى لك الاستمتاع بقسائم الإهداء!\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `Thank you. Enjoy your gift vouchers!\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
		'Extended': {
			'ar': `تمت الموافقة على تمديد صلاحية القسيمة. تاريخ الانتهاء: {date}\nيرجى تقييم الخدمة من خلال الرابط ${ratingLink}`,
			'en': `We would like to inform you that your extension request is approved. The new expiry date is {date}\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
		'Note Extented': {
			'ar': 'ستنتهي صلاحية قسيمة الإهداء خلال 3 أيام. \nاستخدمها قريباً يرجى تجاهل الرسالة في حال قمت باستخدامها. \nنتمنى لكم تسوّق سعيد',
			'en': 'Your gift voucher expires in (3) days. Don\'t forget to use it soon.\n If you have used it already, please disregard this text.\n Happy Shopping',
		},
		'Extension Rejected': {
			'ar': 'نعتذر، لم يتم الموافقة على طلب تمديد الصلاحية. شكرا لتفهمكم.\nيرجى تقييم الخدمة من خلال الرابط',
			'en': 'We regret to inform you that we cannot approve your extension request. Thank you for your understanding.\nPlease rate our service by following the link:\n',
		},
		'Refunded': {
			'ar': 'زبوننا العزيز،\nتمت الموافقة على طلب إرجاع قسيمة الإهداء ومعالجته.\nيرجى تقييم الخدمة من خلال الرابط',
			'en': 'Dear customer,\n We would like to inform you that your refund request is approved and processed.\nPlease rate our service by following the link:\n',
		},
	},
	'Corporate Voucher Sale': {
		'Sold': {
			'ar': `شكراً لك. نتمنى لك الاستمتاع بقسائم الإهداء!\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `Thank you. Enjoy your gift vouchers!\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
		'Extended': {
			'ar': `تمت الموافقة على تمديد صلاحية القسيمة. تاريخ الانتهاء: {date}\nيرجى تقييم الخدمة من خلال الرابط ${ratingLink}`,
			'en': `We would like to inform you that your extension request is approved. The new expiry date is {date}\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
		'Extension Rejected': {
			'ar': 'نعتذر، لم يتم الموافقة على طلب تمديد الصلاحية. شكرا لتفهمكم.\nيرجى تقييم الخدمة من خلال الرابط',
			'en': 'We regret to inform you that we cannot approve your extension request. Thank you for your understanding.\nPlease rate our service by following the link:\n',
		},
		'Refunded': {
			'ar': 'زبوننا العزيز،\nتمت الموافقة على طلب إرجاع قسيمة الإهداء ومعالجته.\nيرجى تقييم الخدمة من خلال الرابط',
			'en': 'Dear customer,\n We would like to inform you that your refund request is approved and processed.\nPlease rate our service by following the link:\n',
		},
	},
	'Power Bank Request': {
		'Out for Delivery': {
			'ar': 'زبوننا العزيز، شكرا لطلب خدمة توصيل الشاحن المتنقل. مندوب خدمة الزبائن في طريقه إليك.',
			'en': 'Dear Customer, Thank you for requesting our powerbank delivery service. Our representative is on their way to you.',
		},
		'In Service': {
			'ar': 'زبوننا العزيز، شكراً لطلب خدمة الشاحن المتنقل. يرجى إعادته لمكتب خدمة الزبائن في الطابق الأرضي خلال ساعتين من وقت الاستلام. للمساعدة، اتصل على 0798502319.',
			'en': 'Dear Customer, Thank you for using our powerbank service. Please return it to Customer Care Desk at Ground Floor within 2 hours. For inquiries, call 0798502319.',
		},
		'Pending Customer': {
			'ar': 'تبقى 15 دقيقة لفترة استخدام الشاحن المتنقل المسموحة. يرجى إعادته لمكتب خدمة الزبائن في حينه.',
			'en': 'We would like to remind you that the remaining usage time of the powerbank is 15 minutes. Please return the powerbank to the Customer Care Desk by then.',
		},
		'En Route for Pickup': {
			'ar': 'شكرا لطلب خدمة استلام الشاحن المتنقل. مندوب خدمة الزبائن في طريقه إليك.',
			'en': 'Thank you for requesting our pick-up service for the powerbank. Our representative is on their way to you to collect it.',
		},
		'Item Returned': {
			'ar': `شكراً لك على استخدام خدمة الشاحن المتنقل. نرجو أن تكون تجربة مميزة لك. يرجى تقييم الخدمة من خلال الرابط ${ratingLink}`,
			'en': `Thank you for using our Power Bank service. We hope you had an enjoyable experience. Please rate our service by following the below link ${ratingLink}`,
		},
		'Wire damaged': {
			'ar': 'نأسف لإبلاغكم بوجود ضرر في سلك الشاحن المتنقل. وفقًا لسياساتنا، سيتم خصم غرامة قدرها 4 د.أ من التأمين',
			'en': 'We regret to inform you that powerbank wire was found damaged. As per our policies, a fine of 4jds will be deducted from security deposit.',
		},
		'Powerbank damaged': {
			'ar': 'نأسف لإبلاغكم بوجود ضرر في الشاحن المتنقل. وفقًا لسياساتنا، سيتم خصم غرامة قدرها 6 د.أ من التأمين',
			'en': 'We regret to inform you that powerbank was found damaged. As per our policies, a fine of 6jds will be deducted from security deposit.',
		},
		'Powerbank and Wire damaged': {
			'ar': 'نأسف لإبلاغكم بوجود ضرر في الشاحن المتنقل والسلك. وفقًا لسياساتنا، سيتم خصم مبلغ التأمين بقيمة 10 د.أ',
			'en': 'We regret to inform you that powerbank and wire was found damaged. As per our policies, security deposit amount of 10jds will be deducted.',
		},

	},
	'Wheelchair Request': {
		'Out for Delivery': {
			'ar': 'زبوننا العزيز، شكراً لطلب خدمة توصيل الكرسي المتحرك. مندوب خدمة الزبائن في طريقه إليك.',
			'en': 'Dear Customer, Thank you for requesting our wheelchair delivery service. Our representative is on their way to you.',
		},
		'In Service': {
			'ar': 'زبوننا العزيز، شكرا لطلب خدمة الكرسي المتحرك. يرجى إعادته لمكتب خدمة الزبائن في الطابق الأرضي قبل الساعة 10م. للمساعدة، اتصل على 0798502319.',
			'en': 'Dear Customer, Thank you for using our wheelchair service. Please return it to the Customer Care Desk on GF before 10pm. For inquiries, call 0798502319.',
		},
		'Pending Customer': {
			'ar': 'تبقى 30 دقيقة على إغلاق المول. يرجى إعادة الكرسي المتحرك لخدمة الزبائن قبل انتهاء ساعات عمل المول.',
			'en': 'Dear Customer, The mall is closing in 30 minutes. Please return the wheelchair to the Customer Care Desk before mall closing hours.',
		},
		'En Route for Pickup': {
			'ar': 'شكراً لطلب خدمة استلام الكرسي المتحرك. مندوب خدمة الزبائن في طريقه إليك لاستلامها.',
			'en': 'Thank you for requesting our pick-up service for the wheelchair. Our representative is on their way to you to collect it.',
		},
		'Item Returned': {
			'ar': `نشكرك على استخدام خدمة الكرسي المتحرك. نرجو أن تكون تجربة مميزة لك. يرجى تقييم الخدمة من خلال الرابط ${ratingLink}`,
			'en': `Thank you for using our wheelchair service. We hope you had an enjoyable experience. Please rate our service by following the below link:\n ${ratingLink}`,
		},
		'Damaged': {
			'ar': 'السلعة تالفة، وفقًا للسياسة، يلزم دفع مبلغ 20 دينارًا أردنيًا',
			'en': 'The item is damaged. As per policy, a payment of 20 JDs is required',
		},
	},
	'Handsfree Request': {
		'En Route for Pickup': {
			'ar': 'شكرا لطلب خدمة الأمانات. مندوب خدمة الزبائن في طريقه لاستلام الحقائب.',
			'en': 'Thank you for requesting our pick-up service for Handsfree.\nOur representative is on their way to you to collect the shopping bags.',
		},
		'Bags Collected': {
			'ar': 'زبوننا العزيز،\nشكرا لطلب خدمة الأمانات. تم استلام حقائب عدد ({bagsNumber}) وتأمينها. رقم البطاقة: {tagNumbers}.\nيرجى الاستلام قبل الساعة 10م أو طلب توصيلها إلى أي موقع في المول.\nللمساعدة، اتصل على 0798502319.',
			'en': 'Dear Customer,\nThank you for using our Handsfree service. Your bags have been collected & secured.\nTag number: {tagNumbers}. Number of bags: {bagsNumber}.\nPlease collect your bags before 10pm or request delivery to any location in City Mall.\nFor inquiries, call 0798502319.',
		},
		'Out for Delivery': {
			'ar': 'شكراً لطلب خدمة توصيل الأمانات.\nمندوب خدمة الزبائن في طريقه إلى موقعك.',
			'en': 'Thank you for using our handsfree delivery service.\nOur representative is on their way to the location provided.',
		},
		'Bags Returned': {
			'ar': `شكراً لك على استخدام خدمة الأمانات.\nنرجو أن تكون تجربة مميزة لك.\nيرجى تقييم الخدمة من خلال الرابط${ratingLink}`,
			'en': `Thank you for using our Handsfree service.\nWe hope you had an enjoyable experience.\nPlease rate our service by following the below link: ${ratingLink}`,
		},
	},
	'Stroller Request': {
		'Out for Delivery': {
			'ar': 'زبوننا العزيز،\nشكراً لطلب خدمة توصيل عربة الأطفال. مندوب خدمة الزبائن في طريقه إليك.',
			'en': 'Dear Customer,\nThank you for requesting our stroller delivery service. Our representative is on their way to you.',
		},
		'In Service': {
			'ar': 'زبوننا العزيز،\nشكرا لطلب خدمة عربة الأطفال. يرجى إعادته لمكتب خدمة الزبائن في الطابق الأرضي قبل الساعة 10م.\nللمساعدة، اتصل على 0798502319.',
			'en': 'Dear Customer,\nThank you for using our stroller service. Please return it to the Customer Care Desk on GF before 10pm.\nFor inquiries, call 0798502319.',
		},
		'Pending Customer': {
			'ar': 'تبقى 30 دقيقة على إغلاق المول.\nيرجى إعادة عربة الأطفال لخدمة الزبائن قبل انتهاء ساعات عمل المول.',
			'en': 'Dear Customer,\nThe mall is closing in 30 minutes. Please return the stroller to the Customer Care Desk before mall closing hours.',
		},
		'En Route for Pickup': {
			'ar': 'شكراً لطلب خدمة استلام عربة الأطفال.\nمندوب خدمة الزبائن في طريقه إليك لاستلامها.',
			'en': 'Thank you for requesting our pick-up service for the stroller.\nOur representative is on their way to you to collect it.',
		},
		'Item Returned': {
			'ar': `نشكرك على استخدام خدمة عربة الأطفال.\nنرجو أن تكون تجربة مميزة لك.\nيرجى تقييم الخدمة من خلال الرابط ${ratingLink}`,
			'en': `Thank you for using our stroller service.\nWe hope you had an enjoyable experience.\nPlease rate our service by following the below link: ${ratingLink}`,
		},
	},
	'Complaints': {
		'Pending Review (Final Level)': {
			'ar': 'زبوننا العزيز،\nشكوتكم قيد المراجعة حالياً. سنبلغكم بأي جديد.',
			'en': 'Dear Customer,\nWe would like to inform you that your complaint is now being reviewed. We will keep you updated.',
		},
		'Closed': {
			'ar': 'زبوننا العزيز،\nتم إغلاق شكوتكم.\nيرجى تقييم الخدمة من خلال الرابط',
			'en': 'Dear Customer,\nWe would like to inform you that your complaint has been resolved.\nPlease rate our service by following the below link: ',
		},
		'resolved': {
			'ar': `زبوننا العزيز،\nتم إغلاق شكوتكم\nيرجى تقييم الخدمة من خلال الرابط\n${ratingLink}`,
			'en': `Dear Customer,\nWe would like to inform you that your complaint has been resolved.\nPlease rate our service by following the below link:\n${ratingLink}`,
		},
		'reviewing': {
			'ar': `زبوننا العزيز،\nشكوتكم قيد المراجعة حالياً. سنبلغكم بأي جديد.`,
			'en': `Dear Customer,\nWe would like to inform you that your complaint is now being reviewed. We will keep you updated.`,
		},
	},
}
export default SmsMessage
