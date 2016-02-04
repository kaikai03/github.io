Title: social.framework
Date: 2013-07-11 10:16
Modified: 2013-07-11 10:16
Category: iDev
Tags: framework,iOS
Slug: social_framework_2013_07_11_10_16
Authors: kai_kai03
Summary: iOS6新增社交分享功能

##UIActivityViewController
&#160; &#160; &#160; &#160;新增的这个控件方便多了，省的去集成一堆乱七八糟的SDK。<br>
&#160; &#160; &#160; &#160;想起之前集成weibo sdk，特么弹出界面一堆bug，还得去覆盖它的类给它重新调界面，简直地狱。

现在只要一小段，任务就完成了：

    -(IBAction)shareAction:(id)sender {   
    NSString *textToShare = @”提示提示提示提示提示。”; 
    UIImage *imageToShare = [UIImage imageNamed:@"img.jpg"];
    NSURL *urlToShare = [NSURL URLWithString:@"http://www.xxx.com"];
    NSArray *activityItems = @[textToShare, imageToShare, urlToShare];
    UIActivityViewController *activityVC = [[UIActivityViewController alloc]initWithActivityItems:activityItems applicationActivities:nil];  
       
    //不出现在活动项目   
    activityVC.excludedActivityTypes = @[UIActivityTypePrint, UIActivityTypeCopyToPasteboard,   
    UIActivityTypeAssignToContact,UIActivityTypeSaveToCameraRoll];
    [self presentViewController:activityVC animated:TRUE completion:nil];  
    }   

自定义也挺方便的：

    -(IBAction)shareAction:(id)sender { 
    NSURL *urlToShare = [NSURL URLWithString:@"http://xxxx.cn/"];
    NSArray *activityItems = @[urlToShare]; 
    BookActivity *bookActivity = [BookActivity new];
    NSArray *applicationActivities = @[bookActivity]; 
    UIActivityViewController *activityVC = [[UIActivityViewController alloc] 
    initWithActivityItems:activityItems 
    applicationActivities:applicationActivities];
    [self presentViewController:activityVC animated:YES completion:nil]; 
    } 

如果程序回应之后需要处理点啥，那就覆盖：

    -(void)activityDidFinish:(BOOL)completed;

用completed来判断是否完成回应。