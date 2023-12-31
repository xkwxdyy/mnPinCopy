JSB.newAddon = function (mainPath) {
  JSB.require('webviewController');
  // 定义一个类，这个类是插件主体
  var mnPinCopyClass = JSB.defineClass(
    'mnPinCopy : JSExtension',
    {
      // 定义插件的生命周期的一些行为
      /* Instance members */

      // Window initialize
      // 用于 MarginNote 开启一个窗口后执行代码
      sceneWillConnect: function () { 
        // self.appInstance 指 MN app 本身
        self.appInstance = Application.sharedInstance();
        // 新建一个窗口实例
        self.addonController = mnPinCopyController.new();
        // 设置实例的主路径
        self.addonController.mainPath = mainPath;
        self.rect = '{{0, 0}, {10, 10}}';
        self.arrow = 1;
      },

      // 用于MarginNote关闭一个窗口后执行代码
      sceneDidDisconnect: function () { // Window disconnect
      },

      // 用于 MarginNote 重新激活一个窗口后执行代码
      sceneWillResignActive: function () { // Window resign active
      },

      // 用于 MarginNote 激活一个窗口后执行代码
      sceneDidBecomeActive: function () { // Window become active
      },

      // 用于 MarginNote 打开一个笔记本后执行代码
      notebookWillOpen: function (notebookid) {
        // 判断当前的模式
        //   1: 文档模式
        //   2: 脑图模式
        //   3: 复习模式
        if (self.appInstance.studyController(self.window).studyMode < 3) {
          // 监听
          NSNotificationCenter.defaultCenter().addObserverSelectorName(
            self,
            "onNewWindow:",
            "newPinWindow"
          )
          NSNotificationCenter.defaultCenter().addObserverSelectorName(
            self,
            "onCloseWindow:",
            "closePinWindow"
          )
          // 刷新插件按钮状态
          self.appInstance.studyController(self.window).refreshAddonCommands();
          //
          self.appInstance.studyController(self.window).view.addSubview(self.addonController.view);
          // 隐藏插件窗口
          self.addonController.view.hidden = true;
          // 设置插件窗口的尺寸和位置
          self.addonController.view.frame = { x: 0, y: 50, width: 300, height: 120 }
          // 锁定插件窗口的尺寸和位置，不加这行代码的话 MNE 中可能会有问题
          self.addonController.currentFrame = { x: 0, y: 50, width: 300, height: 120 }
          self.controllerState = []
        }
        NSTimer.scheduledTimerWithTimeInterval(0.2, false, function () {
          self.appInstance.studyController(self.window).becomeFirstResponder(); //For dismiss keyboard on iOS
        });
      },
      onNewWindow: function (sender) {
        if (self.window!==self.appInstance.focusWindow) {
          return
        }
        let newFrame = sender.userInfo.frame
        let i = 0
        //寻找还没被创建的变量名
        while (self["newWindow"+i]) {
          i = i+1
        }
        // self.appInstance.showHUD("new:"+i,self.window,2)

        if (i>=self.controllerState.length) {
          self.controllerState.push(true)
        }else{
          self.controllerState[i] = true
        }
        self["newWindow"+i] = mnPinCopyController.new();//创建新窗口
        self["newWindow"+i].mainPath = mainPath;
        self["newWindow"+i].view.frame = newFrame
        self["newWindow"+i].currentFrame = newFrame
        self["newWindow"+i].controllerIndex = i
        self.appInstance.studyController(self.window).view.addSubview(self["newWindow"+i].view);
      },
      onCloseWindow: function (sender) {
        let index = sender.userInfo.index
        // self.appInstance.showHUD("close:"+index,self.window,2)
        self["newWindow"+index].view.removeFromSuperview()
        delete self["newWindow"+index]
        self.controllerState[index] = false
      },
      notebookWillClose: function (notebookid) {
        self.addonController.view.removeFromSuperview()
        self.controllerState.forEach((contrllerState,index)=>{
          if (contrllerState) {
            self["newWindow"+index].view.removeFromSuperview()
            delete self["newWindow"+index]
          }
        })
        self.controllerState = []
        NSNotificationCenter.defaultCenter().removeObserverName(self, 'newPinWindow');
        NSNotificationCenter.defaultCenter().removeObserverName(self, 'closePinWindow');
      },

      documentDidOpen: function (docmd5) {
      },

      documentWillClose: function (docmd5) {
      },

      // 只要插件界面移动了就会调用？
      controllerWillLayoutSubviews: function (controller) {
        if (controller !== self.appInstance.studyController(self.window)) {
          return;
        };
        self.setViewFrame("addonController")
        let i = 0
        while (self["newWindow"+i]) {
          self.setViewFrame("newWindow"+i)
          i = i+1
        }
      },
      
      // 查询插件命令状态
      queryAddonCommandStatus: function () {
        if (self.appInstance.studyController(self.window).studyMode < 3) {
          return {
            image: 'logo.png',
            object: self,
            selector: 'toggleAddon:',
            checked: self.watchMode
          };
        } else {
          return null;
        }
      },

      // 在文档模式下选中文本后
      onPopupMenuOnSelection: function (sender) {
      },
      // 在文档模式下进行摘录后
      onProcessNewExcerpt:function (sender) {
      },
      onPopupMenuOnNote: function (sender) { // Clicking note

      },
      toggleAddon:function (sender) {
        // 看用户使用选中了文档的文本
        let textSelected = self.appInstance.studyController(self.window).readerController.currentDocumentController.selectionText
        // 如果选中了就把选中的文本放到插件的输入框中
        if (textSelected) {
          self.addonController.textviewInput.text = textSelected
          self.addonController.view.hidden = false
        }else{
          self.addonController.view.hidden = !self.addonController.view.hidden
        }
        // self.appInstance.showHUD(self.controllerState,self.window,2)
        self.controllerState.forEach((contrllerState,index)=>{
          if (contrllerState) {
            self["newWindow"+index].view.hidden = self.addonController.view.hidden
          }
        
        })
      },
      // 
      async onToggle() {
        self.status = true
        // 刷新插件按钮状态
        self.studyController.refreshAddonCommands()
        self.status = false
        self.studyController.refreshAddonCommands()
      }
    },
    { /* Class members */

      // 插件安装，启用，注意启动 MN 时也会触发。 
      addonDidConnect: function () {
      },
      // 插件卸载，停用时触发。
      addonWillDisconnect: function () {
      },

      applicationWillEnterForeground: function () {
      },

      applicationDidEnterBackground: function () {
      },

      applicationDidReceiveLocalNotification: function (notify) {
      }
    }
  );
  mnPinCopyClass.prototype.setViewFrame= function (contrllerName) {
    if (!this[contrllerName].view.hidden) {
      // 整个 MN 的界面
      let studyFrame = Application.sharedInstance().studyController(this.window).view.bounds
      // 插件当前的界面
      let currentFrame = this[contrllerName].currentFrame
      // 如果插件的水平超出了 MN 界面的宽度，就调整插件的 x，把插件“拉回来”
      if (currentFrame.x + currentFrame.width  >= studyFrame.width) {
        currentFrame.x = studyFrame.width - currentFrame.width
      }
      // 如果插件的 y 值超过了 MN 界面的高度，就将插件的 y 值设置为 MN 界面的高度 - 20
      //   - 也就是说插件如果跑出 MN 界面了，就把他“拉回来”
      if (currentFrame.y + currentFrame.height >= studyFrame.height) {
        currentFrame.y = studyFrame.height - currentFrame.height           
      }
      // 重新设置插件的 frame 的属性值
      this[contrllerName].view.frame = currentFrame
      this[contrllerName].currentFrame = currentFrame
    }
  }

  return mnPinCopyClass;
};