"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const QRCodeLib = require("qrcode");
const canvas = require("canvas");
let QRCodesService = class QRCodesService {
    constructor(qrCodeRepository) {
        this.qrCodeRepository = qrCodeRepository;
    }
    async create(createQRCodeDto) {
        const identifier = `https://nooracademy.co.uk/#/${createQRCodeDto.surveyId}/${createQRCodeDto.subcategoryId}/`;
        const qrCodeData = await QRCodeLib.toDataURL(identifier);
        const qrImage = await canvas.loadImage(qrCodeData);
        const qrCanvas = canvas.createCanvas(200, 200);
        const ctx = qrCanvas.getContext('2d');
        ctx.drawImage(qrImage, 0, 0);
        const logoSize = qrImage.width / 5;
        const logoX = (qrImage.width - logoSize) / 2;
        const logoY = (qrImage.height - logoSize) / 2;
        const finalQRCodeData = qrCanvas.toDataURL();
        return { ...createQRCodeDto, image: finalQRCodeData };
    }
    async findAll(page = 1, perPage = 10) {
        const [qrcodes, total] = await this.qrCodeRepository.findAndCount({
            skip: (page - 1) * perPage,
            take: perPage,
        });
        return { qrcodes, total };
    }
    async findOne(id) {
        const qrCode = await this.qrCodeRepository.findOne({ where: { surveyId: id } });
        if (!qrCode) {
            throw new common_1.NotFoundException(`QR Code with ID ${id} not found`);
        }
        return qrCode;
    }
    async update(id, updateQRCodeDto) {
        await this.findOne(id);
        await this.qrCodeRepository.update(id, updateQRCodeDto);
        return this.findOne(id);
    }
    async remove(id) {
        const qrCode = await this.findOne(id);
        await this.qrCodeRepository.remove(qrCode);
    }
    async generateAndSaveQRCode(createQRCodeDto) {
        const survey = await this.qrCodeRepository.findOne({ where: { surveyId: createQRCodeDto.surveyId } });
        if (survey) {
            return {
                message: "The Survey QR already Exists",
            };
        }
        const identifier = `https://nooracademy.co.uk/#/${createQRCodeDto.location_id}/${createQRCodeDto.survey_template_id}/`;
        const qrCodeData = await QRCodeLib.toDataURL(identifier);
        const qrCanvas = canvas.createCanvas(200, 100, "svg");
        const ctx = qrCanvas.getContext('2d');
        const qrImage = await canvas.loadImage(qrCodeData);
        qrCanvas.width = qrImage.width;
        qrCanvas.height = qrImage.height;
        ctx.drawImage(qrImage, 0, 0);
        const logoImage = await canvas.loadImage('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScLNkN0D-vwqEAyMlLYFaDsJwGoVKmIEcABg&s');
        const logoSize = qrImage.width / 5;
        const logoX = (qrImage.width - logoSize) / 2;
        const logoY = (qrImage.height - logoSize) / 2;
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        const finalQRCodeData = qrCanvas.toDataURL();
        const qrCode = this.qrCodeRepository.create({ ...createQRCodeDto, image: finalQRCodeData });
        const result = await this.qrCodeRepository.save(qrCode);
        return result;
    }
};
exports.QRCodesService = QRCodesService;
exports.QRCodesService = QRCodesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('QRCODE_REPOSITORY')),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], QRCodesService);
//# sourceMappingURL=qrcode.service.js.map