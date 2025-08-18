# 🛠️ Troubleshooting Guide

Having issues with your StayBoost popups? This guide covers the most common problems and their solutions.

## 🚨 Common Issues & Quick Fixes

### 🔍 Popup Not Showing At All

#### **Symptoms**: No popup appears when testing exit-intent

#### **Quick Checklist**:
- [ ] Popup is enabled in StayBoost dashboard
- [ ] StayBoost block is added to your theme
- [ ] Testing in incognito/private browser window
- [ ] Moving mouse cursor toward browser close button (desktop)
- [ ] Using browser back button (mobile)

#### **Step-by-Step Fix**:

1. **Check Dashboard Settings**
   - Go to StayBoost dashboard
   - Verify "Enable Popup" is toggled ON
   - Check that template is selected and configured

2. **Verify Theme Integration**
   - Go to Shopify Admin → Online Store → Themes
   - Click "Customize" on your active theme
   - Look for "StayBoost Popup" block in any section
   - If missing, add it following our [Quick Setup Guide](./quick-setup.md)

3. **Test Properly**
   - Use incognito/private browser window (prevents caching)
   - Load any page on your store
   - Wait 2-3 seconds
   - Move mouse quickly toward browser close button
   - On mobile: tap browser back button

4. **Clear Browser Cache**
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache and cookies
   - Test again in incognito window

### ⏰ Popup Appears Too Quickly/Slowly

#### **Symptoms**: Popup timing feels wrong for user experience

#### **Solutions**:

1. **Adjust Delay Settings**
   - Go to StayBoost dashboard → Settings
   - Change "Delay" setting:
     - Too fast: Increase to 3-4 seconds
     - Too slow: Decrease to 1-2 seconds
   - Save changes and test

2. **Optimal Timing Recommendations**:
   - **New visitors**: 2-3 seconds (give them time to see your content)
   - **Returning visitors**: 1-2 seconds (they know your site)
   - **Mobile users**: 2-4 seconds (different browsing behavior)

### 📱 Mobile Issues

#### **Symptoms**: Popup doesn't work properly on mobile devices

#### **Common Mobile Problems & Fixes**:

1. **Popup Not Triggering on Mobile**
   - Mobile popups trigger on browser back button, not mouse movement
   - Test by tapping browser back button
   - Ensure you're using browser (Safari, Chrome) not social media in-app browsers

2. **Popup Too Large for Mobile Screen**
   - Go to template customization
   - Check mobile preview
   - Choose mobile-optimized template
   - Reduce text length if needed

3. **Buttons Hard to Tap**
   - Switch to mobile-friendly template
   - Ensure buttons are at least 44px tall
   - Check spacing between buttons

### 💸 Discount Code Not Working

#### **Symptoms**: Customers report discount code doesn't work at checkout

#### **Step-by-Step Fix**:

1. **Verify Discount Code in Shopify**
   - Go to Shopify Admin → Discounts
   - Find your discount code (e.g., "SAVE10")
   - Check that it's active and not expired
   - Verify minimum purchase requirements

2. **Check Code Settings**
   - Usage limits: Make sure not exceeded
   - Customer eligibility: Should be available to all customers
   - Active dates: Ensure current date is within range
   - Product restrictions: Verify applies to intended products

3. **Test the Code Manually**
   - Add items to cart
   - Go to checkout
   - Enter discount code manually
   - If it doesn't work, the issue is with Shopify discount settings, not StayBoost

4. **Common Discount Code Issues**:
   - **Expired codes**: Check active date range
   - **Minimum purchase**: Customer cart doesn't meet minimum
   - **Usage limit reached**: Code has been used maximum times
   - **Product exclusions**: Items in cart are excluded from discount

### 📊 Analytics Not Tracking

#### **Symptoms**: Dashboard shows no impressions or conversions

#### **Diagnostic Steps**:

1. **Check Popup Visibility**
   - First ensure popup is actually showing (see "Popup Not Showing" section)
   - If popup shows but no impressions tracked, continue below

2. **Verify Tracking Setup**
   - Check StayBoost dashboard → Analytics
   - Look for data from last 24-48 hours
   - Analytics can take up to 24 hours to appear

3. **Common Tracking Issues**:
   - **Ad blockers**: Some visitors use ad blockers that prevent tracking
   - **GDPR/privacy settings**: Some users opt out of tracking
   - **Browser restrictions**: Safari and Firefox have strict tracking policies

### 🎨 Popup Design Issues

#### **Symptoms**: Popup doesn't look right or match your brand

#### **Common Design Problems & Fixes**:

1. **Colors Don't Match Brand**
   - Go to StayBoost dashboard → Templates
   - Click "Customize" on your active template
   - Update background color, text color, button color
   - Use your brand's hex color codes

2. **Text is Hard to Read**
   - Increase text size in template settings
   - Choose contrasting colors (dark text on light background or vice versa)
   - Simplify message to essential information only

3. **Popup Looks Unprofessional**
   - Try a different template from our library
   - Ensure proper spacing and alignment
   - Use consistent fonts and colors
   - Test on both desktop and mobile

### 🔄 Popup Shows Too Often

#### **Symptoms**: Customers see popup repeatedly, causing annoyance

#### **Solutions**:

1. **Enable "Show Once" Setting**
   - Go to StayBoost dashboard → Settings
   - Turn ON "Show Once" option
   - This prevents repeat visitors from seeing popup

2. **Adjust Frequency Controls**
   - Set longer delays between showings
   - Use session-based tracking
   - Consider time-based limits (once per day/week)

### ⚡ Site Performance Issues

#### **Symptoms**: Store seems slower after installing StayBoost

#### **Performance Optimization**:

1. **Check Loading Method**
   - StayBoost loads asynchronously and shouldn't affect page speed
   - Use Google PageSpeed Insights to test your site
   - Compare before/after StayBoost installation

2. **If Performance Issues Persist**:
   - Check for other recently installed apps
   - Review theme complexity
   - Contact StayBoost support for performance analysis

## 🧪 Testing & Debugging

### **Testing Checklist**:

Before reporting issues, complete this testing checklist:

- [ ] Tested in incognito/private browser window
- [ ] Tested on both desktop and mobile
- [ ] Checked that popup is enabled in dashboard
- [ ] Verified theme integration is complete
- [ ] Tested discount code manually at checkout
- [ ] Waited 24-48 hours for analytics data
- [ ] Tried different browsers (Chrome, Safari, Firefox)

### **Browser-Specific Issues**:

#### **Safari**
- May block some tracking by default
- Enable "Prevent Cross-Site Tracking" = OFF for testing
- Clear Safari cache and test again

#### **Firefox**
- Enhanced tracking protection can interfere
- Disable tracking protection for your store domain
- Test in private window with protections off

#### **Chrome**
- Usually works best with StayBoost
- Clear cache if issues persist
- Check for ad blocker extensions

## 📞 When to Contact Support

### **Contact Support If**:
- [ ] You've tried all troubleshooting steps above
- [ ] Issue persists across multiple browsers and devices
- [ ] You're losing conversions due to technical problems
- [ ] You need help with advanced customization
- [ ] You have questions about optimal setup for your store

### **Before Contacting Support, Please Provide**:
1. **Store URL**: Your Shopify store domain
2. **Problem description**: What's not working
3. **Steps tried**: What troubleshooting you've already done
4. **Browser/device**: What you're testing on
5. **Screenshots**: If helpful for visual issues

### **How to Contact Support**:
- 📧 **Email**: support@stayboost.com
- 💬 **Live Chat**: Available in StayBoost dashboard (Premium plans)
- 📚 **Documentation**: Check our [FAQ](./faq.md) first

## 🎯 Prevention Tips

### **Avoid Common Issues**:

1. **Regular Testing**
   - Test your popups weekly
   - Check after any theme updates
   - Verify after adding other apps

2. **Keep Discount Codes Fresh**
   - Update expiry dates regularly
   - Monitor usage limits
   - Create seasonal codes in advance

3. **Monitor Analytics**
   - Check dashboard weekly
   - Watch for sudden drops in performance
   - Set up alerts for critical issues

4. **Stay Updated**
   - Follow StayBoost updates and announcements
   - Update templates seasonally
   - Review best practices regularly

---

## 🚀 Next Steps

Once your issues are resolved:

1. **[Optimize your popups](./best-practices.md)** for better performance
2. **[Set up A/B testing](./ab-testing-guide.md)** to improve results
3. **[Monitor analytics](./analytics-guide.md)** to track success
4. **[Plan seasonal campaigns](./template-library.md)** for upcoming holidays

Remember: Most issues have simple solutions. When in doubt, start with the basics and work your way up to advanced troubleshooting! 🛠️
