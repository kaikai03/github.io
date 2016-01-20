Title: 图形识别的前置算法
Date: 2011-10-07 20:14
Modified: 2011-10-07 20:14
Category: 音视频
Tags: C,Object-C,algorithm,FFmpeg,UIImage,iOS
Slug: someAlgorithm_2011_10_07_20_14
Authors: kai_kai03
Summary: 随便写了些，但是......


## 随笔 ##
后面估计不会继续下去，小iPhone4的性能还是跟不上，视频里只做到去除光照影响，性能就已经跟不上了。更何况之前弄的背景建模还没移植过来.......

以后真正要做的话还是上服务端吧。

本文把写的代码备份下等以后也许有用。

## 零碎代码 ##
FFmpeg解码出RGB:

	-(void)convertFrameToRGB {	
		sws_scale (img_convert_ctx, pFrame->data, pFrame->linesize,
				   0, pCodecCtx->height,
				   picture.data, picture.linesize);	
	}

最开始使用的二值化，精度实在是.....效果随着时间变化而线性变化，哈哈哈哈，原代码已经去掉了，这边留一份吧:

	-(void)to2L
	{
	    unsigned char *input = picture.data[0];
	    for (int offset = 0; offset<= outputWidth*outputHeight; offset++) {
	        unsigned char r = input[offset*3];
	        unsigned char g = input[offset*3 +1];
	        unsigned char b = input[offset*3 +2];
	        unsigned char mi = MIN(r, MIN(g, b));
	        unsigned char ma = MAX(r, MAX(g, b));
	        if (((unsigned short)mi + (unsigned short)ma) > 170*2) {
	            input[offset*3] = input[offset*3+1] = input[offset*3 + 2] = 255;
	        }else{
	            input[offset*3] = input[offset*3+1] = input[offset*3 + 2] = 0;
	        }
	    }
	}


图像转为灰度图（r=g=b = 0.299r+0.587g+0.114b）：

	-(void)toGrey
	{
	    unsigned char *input = picture.data[0];
	    for (int offset = 0; offset<= outputWidth*outputHeight; offset++) {
	        int rgbOffset = offset *3;
	        unsigned char t = (unsigned char)((19595 * input[rgbOffset] + 38469 * input[rgbOffset +1] + 7471 * input[rgbOffset +2])>>16);

	        input[rgbOffset] = input[rgbOffset+1] = input[rgbOffset + 2] = t; 
	    }
	}

高斯平滑：


	-(void)toSmoothGauss:(unsigned char *)rgba width:(int)width height:(int)height isGrey:(BOOL)isG
	{
	    unsigned char *input = rgba;
		//unsigned char mask[9] = {1,2,1,2,4,2,1,2,1};
	    int columnLength = width*3;
	    for (int c=1; c<=height-1; c++) {
	        for (int rb=1; rb<=width*3-1; rb++) {
	            int rgbOffset = rb + c*columnLength;
	            input[rgbOffset] = (input[rgbOffset-columnLength-3] +
	                                input[rgbOffset-columnLength]*2 +
	                                input[rgbOffset-columnLength+3] +
	                                input[rgbOffset-3]*2 +
	                                input[rgbOffset]*4 +
	                                input[rgbOffset+3]*2 +
	                                input[rgbOffset+columnLength-3] +
	                                input[rgbOffset+columnLength]*2 +
	                                input[rgbOffset+columnLength+3] )/16;
	            if (isG) {
	                input[rgbOffset - 1] = input[rgbOffset + 1] =  input[rgbOffset];
	                rb+=2;
	            }
	            
	        }
	    }
	}

平均灰度二值化：

	-(void)to2VWithGrey:(unsigned char *)rgba width:(int)width height:(int)height
	{
	    unsigned char *input = rgba;
	    unsigned int greyAVE = 0;
	    for (int offset = 0; offset<= width*height; offset++) {
	        int rgbOffset = offset *3;
	        unsigned char t = (unsigned char)((19595 * input[rgbOffset] + 38469 * input[rgbOffset +1] + 7471 * input[rgbOffset +1])>>16);
	        //input[rgbOffset] = input[rgbOffset+1] = input[rgbOffset + 2] = t;
	        greyAVE += t;
	    }
	    greyAVE = greyAVE/(width*height);
	    for (int offset = 0; offset<= width*height; offset++) {
	        int rgbOffset = offset *3;
	        unsigned char t = (unsigned char)((19595 * input[rgbOffset] + 38469 * input[rgbOffset +1] + 7471 * input[rgbOffset +1])>>16);
	        //unsigned char t = (unsigned char)((0.299f * input[rgbOffset] + 0.587f * input[rgbOffset +1] + 0.114f * input[rgbOffset +1]));
	        if (t >= greyAVE) {
	            input[rgbOffset] = input[rgbOffset+1] = input[rgbOffset + 2] = 255;
	        }else{
	            input[rgbOffset] = input[rgbOffset+1] = input[rgbOffset + 2] = 0;
	        }
	        
	    }
	}


Sobel边界检测的二值化：

	-(void)to2VFromSobel:(unsigned char *)rgba  width:(int)width height:(int)height
	{
	    unsigned char *wanted = malloc(width*height*3);
	    memset(wanted, 0, width*height*3);
	    
	    unsigned char *input = rgba;
	    int columnLength = width*3;
	    for (int c=1; c<=height-1; c++) {
	        for (int rb=3; rb<=width*3-3; rb+=3) {
	            int rgbOffset = rb + c*columnLength;
	            int Dx = input[rgbOffset-columnLength+3] +
	                    input[rgbOffset+3]*2 +
	                    input[rgbOffset+columnLength+3] -
	                    input[rgbOffset-columnLength-3] -
	                    input[rgbOffset-3]*2 -
	                    input[rgbOffset+columnLength-3];
	            int Dy = input[rgbOffset+columnLength-3] +
	                input[rgbOffset+columnLength]*2 +
	                input[rgbOffset+columnLength+3] -
	                input[rgbOffset-columnLength-3] -
	                input[rgbOffset-columnLength]*2 -
	                input[rgbOffset-columnLength+3];
	            int mag =roundf(sqrtf(Dx*Dx+Dy*Dy));
				//int mag = abs(Dx)+abs(Dy);
	            wanted[rgbOffset] = mag;
	        }
	    }
	    for (int c=1; c<=height-1; c++) {
	        for (int rb=3; rb<=width*3-3; rb+=3) {
	            int rgbOffset = rb + c*columnLength;
	            unsigned char mag = wanted[rgbOffset];
	            if (mag >= sobelAlpha) {
	                input[rgbOffset] = input[rgbOffset+1] =input[rgbOffset+2] = 0;
	            }else{
	                input[rgbOffset] = input[rgbOffset+1] =input[rgbOffset+2] = 255;
	            }
	        }
	    }
	    
	    free(wanted);
	    
		//free(rgba);
		//rgba = wanted;
	    
	}

高光判断：

	-(void)totakeHighLight:(unsigned char *)rgba width:(int)width height:(int)height
	{
	    unsigned char *input = rgba;
	    for (int offset = 1; offset<= width*height; offset++) {
	        int rgbOffset = offset *3;
	        //input[rgbOffset] = input[rgbOffset+1] = input[rgbOffset + 2] = t;
	        int r = (int)input[rgbOffset] + ((int)input[rgbOffset] - (int)input[rgbOffset-3])/2;
	        if (r>255) {
	            input[rgbOffset] = 255;
	        }if (r < 0) {
	            input[rgbOffset] = 0;
	        } else {
	            input[rgbOffset] = (unsigned char )r;
	        }
	        
	        int g = (int)input[rgbOffset+1] + ((int)input[rgbOffset+1] - (int)input[rgbOffset-3+1])/2;
	        if (g>255) {
	            input[rgbOffset+1] = 255;
	        }if (g < 0) {
	            input[rgbOffset+1] = 0;
	        } else {
	            input[rgbOffset+1] = (unsigned char )g;
	        }
	        
	        int b = (int)input[rgbOffset+2] + ((int)input[rgbOffset+2] - (int)input[rgbOffset-3+2])/2;
	        if (b>255) {
	            input[rgbOffset+2] = 255;
	        }if (b < 0) {
	            input[rgbOffset+2] = 0;
	        } else {
	            input[rgbOffset+2] = (unsigned char )b;
	        }
	    }
	}

最后记录一个将rgb转回UIImage控件的方法：

	-(UIImage *)imageFromAVPicture:(AVPicture)pict width:(int)width height:(int)height {
		CGBitmapInfo bitmapInfo = kCGBitmapByteOrderDefault;
		CFDataRef data = CFDataCreateWithBytesNoCopy(kCFAllocatorDefault, pict.data[0], pict.linesize[0]*height,kCFAllocatorNull);
		CGDataProviderRef provider = CGDataProviderCreateWithCFData(data);
		CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
		CGImageRef cgImage = CGImageCreate(width, 
										   height, 
										   8, 
										   24, 
										   pict.linesize[0], 
										   colorSpace, 
										   bitmapInfo, 
										   provider, 
										   NULL, 
										   NO, 
										   kCGRenderingIntentDefault);
		CGColorSpaceRelease(colorSpace);
		UIImage *image = [UIImage imageWithCGImage:cgImage];
		CGImageRelease(cgImage);
		CGDataProviderRelease(provider);
		CFRelease(data);
	
		return image;
	}