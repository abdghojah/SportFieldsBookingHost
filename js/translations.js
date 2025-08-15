import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Common
      common: {
        locale: 'en-US',
        day: 'day',
        currency: 'JOD',
        loading: 'Loading...',
        error: 'An error occurred',
        success: 'Success!',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        required: 'Required',
        optional: 'Optional',
        search: 'Search',
        clear: 'Clear',
        noResults: 'No results found',
        to: 'to',
        time: 'Time',
        timeFrom: 'From',
        timeTo: 'To',
        cooldown: 'Please wait {{seconds}} seconds before requesting another code',
        orSearchByTimeLocation: 'Or Search By Time & Location',
        status: {
          label: 'Status',
          active: 'Active',
          allStatuses: 'All Statuses',
          cancelled: 'Cancelled',
          paid: 'Paid',
          waitingPayment: 'Waiting Payment',
          noPayment: 'Cancelled - No Payment',
          userCancelled: 'User Cancelled',
          adminCancelled: 'Admin Cancelled'
        },
        error: {
          selectDates: 'Please select both from and to dates',
          invalidDateRange: 'From date must be before or equal to to date',
          loadField: 'Failed to load field data. Please try again.',
          loadReservations: 'Failed to load reservations. Please try again.',
          pastTime: 'Cannot book time slots in the past. Please select a future date and time.',
          tooShort: 'This time slot is too short. Minimum booking time is {{hours}} hour{{plural}}. Please select a longer time period.',
          patternMismatch: 'This time slot doesn\'t match the field\'s time pattern. Start time must be every {{hours}} hour{{plural}} from {{startTime}}. Please adjust your selection.',
          durationPattern: 'This duration doesn\'t match the field\'s time pattern. Duration must be a multiple of {{hours}} hour{{plural}}. Please adjust your selection.',
          blockedTime: 'This time slot is not available due to field maintenance or restrictions. Blocked time: {{from}} - {{to}}. Please select a different time.',
          alreadyBooked: 'This time slot is already booked by another player. Existing reservation: {{from}} - {{to}}. Please select a different time.',
          checkAvailability: 'Unable to check time availability. Please try again or contact support if the problem persists.'
        }
      },

      // Navigation
      nav: {
        home: 'Home',
        login: 'Login',
        signup: 'Signup',
        logout: 'Logout',
        contact: 'Contact Us',
        manageReservation: 'Manage Reservation',
        manageReservations: 'Manage Reservations',
        myFields: 'My Fields',
        subscribedFields: 'All Fields',
        howItWorks: 'How it Works'
      },

      // Hero Section
      hero: {
        title: 'Find and Book Sports Fields in Jordan',
        subtitle: 'Football, Tennis, Volleyball, Basketball and more',
      },

      // Search Form
      search: {
        title: 'Find Available Fields',
        city: 'City',
        cityPlaceholder: 'Select City',
        placeName: 'Search by Place Name',
        placeNamePlaceholder: 'Enter place name',
        sportType: 'Sport Type',
        sportTypePlaceholder: 'Select Sport',
        date: 'Date',
        time: 'Time',
        searchFields: 'Search Fields',
        availableFields: 'Available Fields',
        placeName: 'Search by Place Name',
        searchPlaces: 'Search Places',
        foundPlaces: 'Found Places',
        districtPlaceholder: 'Select District'
      },

      // Auth Forms
      auth: {
        phone: 'Phone Number',
        password: 'Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot Password?',
        noAccount: 'Don\'t have an account?',
        haveAccount: 'Already have an account?',
        signupLink: 'Sign up',
        loginLink: 'Login',
        backToLogin: 'Back to Login',
        resetPassword: 'Reset Password',
        verificationCode: 'Verification Code',
        enterCode: 'Enter the code sent to you',
        resendCode: 'Resend Code',
        verify: 'Verify',
        requestCode: 'Request Verification Code',
        signupTitle: 'Signup',
        createAccount: 'Create Account',
        confirmLogout: 'Confirm Logout',
        logoutWarning: 'Are you sure you want to logout?',
        accountType: 'Account Type',
        selectAccountType: 'Select Account Type',
        player: 'Player',
        fieldOwner: 'Field Owner',
        playerLogin: 'Player Login Required',
        loginAndReserve: 'Login & Reserve',
        name: 'Name',
        nameHelp: 'This name can be used to verify your cliq payment for reservations, better to match your name in the bank or personal ID.',
        secondaryPhone: 'Secondary Phone',
        secondaryPhoneHelp: 'Optional secondary contact number',
        passwordPlaceHolder: 'Enter your password',
        phoneNumberPlaceHolder: 'Enter phone number (07xxxxxxxx)',
        confirmPasswordPlaceHolder: 'Confirm your password'
      },

      // Field Details
      field: {
        name: 'Field Name',
        sportType: 'Sport Type',
        fieldType: 'Field Type',
        fieldTypeOutdoor: 'Outdoor',
        fieldTypeIndoor: 'Indoor',
        fieldTypeAll: 'All Types',
        location: 'Location',
        district: 'District',
        districtPlaceholder: 'Select District',
        price: 'Price Per Hour',
        pricePerHour: '/hour',
        minBookingTime: 'Minimum Booking Time (hour)',
        includedServices: 'Included Services',
        images: 'Field Images',
        timePattern: 'Time Pattern',
        blockedTimes: 'Blocked Times',
        reservations: 'Reservations',
        addField: 'Add New Field',
        addFieldTitle: 'Add New Field',
        updateFieldTitle: 'Update Field',
        editField: 'Edit Field',
        deleteField: 'Delete Field',
        confirmDelete: 'Are you sure you want to delete this field?',
        deleteWarning: 'Are you sure you want to delete this field? This action cannot be undone.',
        noFields: 'You don\'t have any fields yet. Click "Add New Field" to create one.',
        addTimeBlock: 'Add Time Block',
        discountTimes: 'Discount Time Ranges (Optional)',
        addDiscountTime: 'Add Discount Time',
        discountPercentage: 'Discount %',
        patternEvery: 'Every (Hour)',
        searchPatternEvery: 'Every',
        searchPatterenHour: 'Hour',
        startingFrom: 'starting From',
        patterenExample: 'Example: "Every 2 hours starting from 4:00" means slots like 4:00-6:00, 6:00-8:00 are allowed, but 4:30-6:30 is not.',
        everyHoursPlaceholder: 'Hours',
        additionalServices: 'List services available in the field (e.g., water, balls, changing rooms)'
      },

      // Reservation
      reservation: {
        title: 'Reserve This Field',
        selectDateTime: 'Select Date & Time',
        timeInfo: 'Time Information for',
        timePattern: 'Allowed Time Pattern',
        blockedTimes: 'Blocked Times',
        existingReservations: 'Existing Reservations',
        selectTimeRange: 'Select Time Range',
        minBookingTime: 'Minimum booking time',
        details: 'Reservation Details',
        reserverName: 'Name',
        reserverPhone: 'Phone Number',
        phoneHelp: 'Must be a Jordanian phone number (07xxxxxxxx)',
        selectedSlot: 'Selected Time Slot',
        success: 'Reservation Made!',
        successMessage: 'Your reservation is temporarly allocated. You should pay reservation fee in one hour to avoid cancellation, once paid confirmation message will be sent.',
        successMessageWithFee: 'Your reservation is temporarily allocated. You must pay exactly {{fee}} {{currency}} as reservation fee to "AbdGH" via Cliq within one hour to confirm your booking, or it will be automatically cancelled.',
        reservationId: 'Reservation ID',
        reservationFee: 'Reservation Fee',
        cancelInfo: 'You can cancel this reservation by visiting the Manage Reservation page.',
        noReservationsForDay: 'No reserved time slots in this day',
        noBlockedDaysForDay: 'No blocked times for this day',
        noPatterenRequired: 'No specific time pattern',
        playerLoginRequired: 'Please use your player account to make a reservation',
        paymentNotice: 'To confirm your reservation, you must pay a reservation fee (max 1 JD, separate from field fees) to cliq "AbdGH" within one hour or the reservation will be cancelled.',
        totalLabel: 'Total',
        loginAndReserve: 'Reserve',
        manageTitle: 'Manage Reservations',
        yourReservations: 'Your Reservations',
        noReservations: 'You don\'t have any reservations for the selected criteria.',
        confirmCancel: 'Confirm Cancellation',
        cancelWarning: 'Are you sure you want to cancel this reservation? This action cannot be undone.',
        cancelReservation: 'Cancel Reservation',
        keepReservation: 'Keep Reservation',
        fromDate: 'From Date',
        toDate: 'To Date',
        status: 'Status',
        time: 'Time',
        sport: 'Sport',
        place: 'Place',
        totalPrice: 'Total Price',
        selectDateRange: 'Select a date range to view reservations',
        cannotCancelNotice: 'Cannot cancel (already cancelled or old reservation)'
      },

      // Contact
      contact: {
        title: 'Contact Us',
        email: 'Email',
        phone: 'Phone',
        message: 'Message',
        sendMessage: 'Send Message',
      },

      subscribedFields: {
        title: 'Subscribed Fields',
        subtitle: 'Discover all the sports facilities that trust SportSpot'
      },

      // days (for dropdowns and displays)
      days: {
        sunday: 'Sunday',
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
      },
      
      // Sports (for dropdowns and displays)
      sports: {
        football: 'Football',
        tennis: 'Tennis',
        volleyball: 'Volleyball',
        basketball: 'Basketball',
        padel: 'Padel'
      },

      // Cities (for dropdowns)
      cities: {
        amman: 'Amman',
        irbid: 'Irbid',
        zarqa: 'Zarqa',
        aqaba: 'Aqaba',
        jerash: 'Jerash',
        madaba: 'Madaba',
        salt: 'Salt',
        karak: 'Karak',
        ajloun: 'Ajloun',
        mafraq: 'Mafraq'
      },

      // View controls
      views: {
        listView: 'List View',
        mapView: 'Map View',
        sportsLegend: 'Sports Legend',
        fieldsCount: '{{count}} field',
        fieldsCountPlural: '{{count}} fields',
        reserveField: 'Reserve Field',
        hour: 'hour'
      },

      // How it Works
      howItWorks: {
        title: 'How SportSpot Works',
        step1: {
          title: '1. Find Your Perfect Field',
          description: 'Search for a field using location and time, or search for a specific place by name and select a field from that location.'
        },
        step2: {
          title: '2. Choose Your Time',
          description: 'In the field page, you can update the date and time as needed. The page provides helpful reservation information including:',
          items: [
            'Minimum booking time',
            'Blocked times',
            'Allowed time patterns',
            'Already reserved times'
          ]
        },
        step3: {
          title: '3. Make Your Reservation',
          description: 'Once you select a date and time, you\'ll need to:',
          items: [
            'Enter your name (must match the name used for payment)',
            'Provide your phone number',
            'Verify your phone number using an OTP code'
          ]
        },
        step4: {
          title: '4. Confirm Your Booking',
          description: 'After the initial reservation:',
          items: [
            'Your spot is temporarily reserved but not confirmed',
            'Pay around 1 JOD reservation fee (exact value will be available once field reserved, needs to pay exact fee value to confirm reservation) using Cliq, separate from field fees.',
            'Complete payment within one hour to avoid automatic cancellation',
            'Receive WhatsApp confrimation once payment verified.'
          ]
        },
        step5: {
          title: '5. Manage Your Reservations',
          description: 'Use the "Manage Reservation" link on the main page to:',
          items: [
            'View your active reservations',
            'Check reservation status',
            'Cancel reservations if needed'
          ]
        }
      },

      // Footer
      footer: {
        copyright: '© {{year}} SportSpot. All rights reserved.',
      },
    },
  },
  ar: {
    translation: {
      // Common
      common: {
        locale: 'ar',
        day: 'اليوم',
        currency: 'دينار',
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        success: 'تم بنجاح!',
        cancel: 'إلغاء',
        save: 'حفظ',
        delete: 'حذف',
        confirm: 'تأكيد',
        back: 'رجوع',
        next: 'التالي',
        submit: 'إرسال',
        required: 'مطلوب',
        optional: 'اختياري',
        search: 'بحث',
        clear: 'مسح',
        noResults: 'لا توجد نتائج',
        to: 'إلى',
        time: 'الوقت',
        timeFrom: 'من',
        timeTo: 'إلى',
        cooldown: 'يرجى الانتظار {{seconds}} ثانية قبل طلب رمز آخر',
        orSearchByTimeLocation: 'أو البحث حسب الوقت والموقع',
        status: {
          label: 'الحالة',
          active: 'نشط',
          allStatuses: 'الكل',
          cancelled: 'ملغي',
          paid: 'مدفوع',
          waitingPayment: 'في انتظار الدفع',
          noPayment: 'ملغى - لم يتم الدفع',
          userCancelled: 'ألغاه المستخدم',
          adminCancelled: 'ألغاه المدير'
        },
        error: {
          selectDates: 'يرجى اختيار تاريخ البداية والنهاية',
          invalidDateRange: 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية',
          loadField: 'فشل في تحميل بيانات الملعب. يرجى المحاولة مرة أخرى.',
          loadReservations: 'فشل في تحميل الحجوزات. يرجى المحاولة مرة أخرى.',
          pastTime: 'لا يمكن حجز أوقات في الماضي. يرجى اختيار تاريخ ووقت مستقبلي.',
          tooShort: 'هذا الوقت قصير جداً. الحد الأدنى للحجز هو {{hours}} ساعة{{plural}}. يرجى اختيار فترة أطول.',
          patternMismatch: 'هذا الوقت لا يتطابق مع نمط الملعب. وقت البداية يجب أن يكون كل {{hours}} ساعة{{plural}} من {{startTime}}. يرجى تعديل اختيارك.',
          durationPattern: 'هذه المدة لا تتطابق مع نمط الملعب. المدة يجب أن تكون مضاعف {{hours}} ساعة{{plural}}. يرجى تعديل اختيارك.',
          blockedTime: 'هذا الوقت غير متاح بسبب صيانة الملعب أو قيود. الوقت المحجوب: {{from}} - {{to}}. يرجى اختيار وقت مختلف.',
          alreadyBooked: 'هذا الوقت محجوز بالفعل من قبل لاعب آخر. الحجز الموجود: {{from}} - {{to}}. يرجى اختيار وقت مختلف.',
          checkAvailability: 'غير قادر على فحص توفر الوقت. يرجى المحاولة مرة أخرى أو الاتصال بالدعم إذا استمرت المشكلة.'
        }
      },

      // Navigation
      nav: {
        home: 'الرئيسية',
        login: 'تسجيل الدخول',
        signup: 'إنشاء حساب',
        logout: 'تسجيل الخروج',
        contact: 'اتصل بنا',
        manageReservation: 'إدارة الحجوزات',
        manageReservations: 'إدارة جميع الحجوزات',
        myFields: 'ملاعبي',
        subscribedFields: 'قائمة الملاعب',
        howItWorks: 'كيف يعمل الموقع'
      },

      // Hero Section
      hero: {
        title: 'ابحث واحجز الملاعب الرياضية في الأردن',
        subtitle: 'كرة القدم، التنس، الكرة الطائرة، كرة السلة والمزيد',
      },

      // Search Form
      search: {
        title: 'ابحث عن الملاعب المتاحة',
        city: 'المدينة',
        cityPlaceholder: 'اختر المدينة',
        placeName: 'البحث باسم المكان',
        placeNamePlaceholder: 'أدخل اسم المكان',
        sportType: 'نوع الرياضة',
        sportTypePlaceholder: 'اختر الرياضة',
        date: 'التاريخ',
        time: 'الوقت',
        searchFields: 'بحث عن الملاعب',
        availableFields: 'الملاعب المتاحة',
        placeName: 'البحث باسم المكان',
        searchPlaces: 'بحث عن الأماكن',
        foundPlaces: 'الأماكن المتوفرة',
        districtPlaceholder: 'اختر المنطقة'
      },

      // Auth Forms
      auth: {
        phone: 'رقم الهاتف',
        password: 'كلمة المرور',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور',
        forgotPassword: 'نسيت كلمة المرور؟',
        noAccount: 'ليس لديك حساب؟',
        haveAccount: 'لديك حساب بالفعل؟',
        signupLink: 'إنشاء حساب',
        loginLink: 'تسجيل الدخول',
        backToLogin: 'العودة لتسجيل الدخول',
        resetPassword: 'إعادة تعيين كلمة المرور',
        verificationCode: 'رمز التحقق',
        enterCode: 'أدخل الرمز المرسل إليك',
        resendCode: 'إعادة إرسال الرمز',
        verify: 'تحقق',
        requestCode: 'طلب رمز التحقق',
        signupTitle: 'إنشاء حساب',
        createAccount: 'إنشاء حساب',
        confirmLogout: 'تأكيد تسجيل الخروج',
        logoutWarning: 'هل أنت متأكد من تسجيل الخروج؟',
        accountType: 'نوع الحساب',
        selectAccountType: 'اختر نوع الحساب',
        player: 'لاعب',
        fieldOwner: 'مالك ملعب',
        playerLogin: 'تسجيل دخول اللاعب مطلوب',
        loginAndReserve: 'تسجيل الدخول والحجز',
        name: 'الاسم الكامل بالانجليزية',
        nameHelp: 'يفضل مطابقة الاسم بالبنك او الهوية بالضبط حيث يمكن استخدامه للتحقق من دفع كليك للحجوزات',
        secondaryPhone: 'الهاتف الثانوي',
        secondaryPhoneHelp: 'رقم اتصال ثانوي اختياري',
        passwordPlaceHolder: 'ادخل كلمة المرور',
        phoneNumberPlaceHolder: '(07xxxxxxxx) ادخل رقم الهاتف',
        confirmPasswordPlaceHolder: 'تأكيد كلمة المرور'
      },

      // Field Details
      field: {
        name: 'اسم الملعب',
        sportType: 'نوع الرياضة',
        fieldType: 'نوع الملعب',
        fieldTypeOutdoor: 'خارجي',
        fieldTypeIndoor: 'داخلي',
        fieldTypeAll: 'جميع الأنواع',
        location: 'الموقع',
        district: 'المنطقة',
        districtPlaceholder: 'اختر المنطقة',
        price: 'السعر للساعة',
        pricePerHour: '/ساعة',
        minBookingTime: 'الحد الادنى لمدة الحجز (ساعة)',
        includedServices: 'الخدمات المشمولة',
        images: 'صور الملعب',
        timePattern: 'نمط الوقت',
        blockedTimes: 'الأوقات الممنوعة',
        reservations: 'الحجوزات',
        addField: 'إضافة ملعب جديد',
        addFieldTitle: 'إضافة ملعب جديد',
        updateFieldTitle: 'تحديث الملعب',
        editField: 'تعديل الملعب',
        deleteField: 'حذف الملعب',
        confirmDelete: 'هل أنت متأكد من حذف هذا الملعب؟',
        deleteWarning: 'هل أنت متأكد من حذف هذا الملعب؟ لا يمكن التراجع عن هذا الإجراء.',
        noFields: 'ليس لديك أي ملاعب حتى الآن. انقر على "إضافة ملعب جديد" لإنشاء واحد.',
        addTimeBlock: 'إضافة فترة زمنية',
        discountTimes: 'فترات الخصم (اختياري)',
        addDiscountTime: 'إضافة وقت خصم',
        discountPercentage: 'نسبة الخصم %',
        patternEvery: "كل (ساعة)",
        searchPatternEvery: 'كل',
        searchPatterenHour: 'ساعة',
        startingFrom: 'بدءا من',
        patterenExample: 'مثال : كل 2 ساعة بدءا من 4:00 تعني حجوزات مثل 4:00-6:00 او 6:00-8:00 مسموحة لكن 4:30-6:30 غير مسموحة',
        everyHoursPlaceholder: 'ساعات',
        additionalServices: 'اضف الخدمات المتوفرة بالملعب مثل ماء او كرة او كلرات او اي معلومات اضافية مثل حجم الملعب '
      },

      // Reservation
      reservation: {
        title: 'حجز الملعب',
        selectDateTime: 'اختر التاريخ والوقت',
        timeInfo: 'معلومات الوقت ل',
        timePattern: 'نمط الوقت المسموح',
        blockedTimes: 'الأوقات الممنوعة',
        existingReservations: 'الحجوزات الحالية',
        selectTimeRange: 'اختر نطاق الوقت',
        minBookingTime: 'الحد الأدنى لمدة الحجز',
        details: 'تفاصيل الحجز',
        reserverName: 'الاسم',
        reserverPhone: 'رقم الهاتف',
        phoneHelp: 'يجب أن يكون رقم هاتف أردني (07xxxxxxxx)',
        selectedSlot: 'الوقت المختار',
        success: 'تم الحجز!',
        successMessage: 'سيتم حجز الملعب مؤقتا, يجب دفع رسوم الحجز خلال ساعة لتجنب الالغاء.',
        successMessageWithFee: 'تم حجز الملعب مؤقتاً. يجب دفع {{fee}} {{currency}} بالضبط كرسوم حجز إلى "AbdGH" عبر كليك خلال ساعة واحدة لتأكيد حجزك، وإلا سيتم إلغاؤه تلقائياً.',
        reservationId: 'رقم الحجز',
        reservationFee: 'رسوم الحجز',
        cancelInfo: 'يمكنك إلغاء هذا الحجز عن طريق زيارة صفحة إدارة الحجوزات.',
        noReservationsForDay: 'لا يوجد اوقات محجوزة في هذا اليوم',
        noBlockedDaysForDay: 'لا يوجد اوقات ممنوعة في هذا اليوم',
        noPatterenRequired: 'لا يوجد نمظ معين مطلوب للوقت',
        playerLoginRequired: 'الرجاء استخدام حساب لاعب للحجز',
        paymentNotice: 'To confirm your reservation, you must pay a reservation fee (max 1 JD, separate from field fees) to cliq "AbdGH" within one hour or the reservation will be cancelled.',
        paymentNotice: ' لتأكيد الحجز يجب دفع رسوم حجز (منفصل عن رسوم الملعب) بقيمة لا تتجاوز 1 دينار (القيمة بالضبط ستظهر بعد الحجز) لحساب كليك ABDGH خلال ساعة او سيتم الغاء الحجز ',
        totalLabel: 'المجموع',
        loginAndReserve: 'احجز',
        manageTitle: 'إدارة الحجوزات',
        yourReservations: 'حجوزاتك',
        noReservations: 'ليس لديك أي حجوزات للمعايير المحددة.',
        confirmCancel: 'تأكيد الإلغاء',
        cancelWarning: 'هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.',
        cancelReservation: 'إلغاء الحجز',
        keepReservation: 'الاحتفاظ بالحجز',
        fromDate: 'من تاريخ',
        toDate: 'إلى تاريخ',
        status: 'الحالة',
        time: 'الوقت',
        sport: 'الرياضة',
        place: 'المكان',
        totalPrice: 'السعر الإجمالي',
        selectDateRange: 'اختر نطاق تاريخ لعرض الحجوزات',
        cannotCancelNotice: 'الالغاء غير ممكن (تم الغاءه مسبقا او حجز قديم)'
      },

      // Contact
      contact: {
        title: 'اتصل بنا',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        message: 'الرسالة',
        sendMessage: 'إرسال الرسالة',
      },

      subscribedFields: {
        title: 'الملاعب المشتركة',
        subtitle: 'اكتشف جميع المرافق الرياضية التي تثق في سبورت سبوت'
      },

      // days (for dropdowns and displays)
      days: {
        sunday: 'الأحد',
        monday: 'الأثنين',
        tuesday: 'الثلاثاء',
        wednesday: 'الأربعاء',
        thursday: 'الخميس',
        friday: 'الجمعة',
        saturday: 'السبت',
      },
      
      // Sports (for dropdowns and displays)
      sports: {
        football: 'كرة القدم',
        tennis: 'التنس',
        volleyball: 'الكرة الطائرة',
        basketball: 'كرة السلة',
        padel: 'البادل'
      },

      // Cities (for dropdowns)
      cities: {
        amman: 'عمان',
        irbid: 'إربد',
        zarqa: 'الزرقاء',
        aqaba: 'العقبة',
        jerash: 'جرش',
        madaba: 'مادبا',
        salt: 'السلط',
        karak: 'الكرك',
        ajloun: 'عجلون',
        mafraq: 'المفرق'
      },

      // View controls
      views: {
        listView: 'عرض القائمة',
        mapView: 'عرض الخريطة',
        sportsLegend: 'دليل الرياضات',
        fieldsCount: '{{count}} ملعب',
        fieldsCountPlural: '{{count}} ملعب',
        reserveField: 'احجز الملعب',
        hour: 'ساعة'
      },

      // How it Works
      howItWorks: {
        title: 'كيف يعمل سبورت سبوت',
        step1: {
          title: '1. ابحث عن الملعب المثالي',
          description: 'ابحث عن ملعب باستخدام الموقع والوقت، أو ابحث عن مكان محدد بالاسم واختر ملعباً من ذلك الموقع.'
        },
        step2: {
          title: '2. اختر وقتك',
          description: 'في صفحة الملعب، يمكنك تحديث التاريخ والوقت حسب الحاجة. توفر الصفحة معلومات مفيدة للحجز تشمل:',
          items: [
            'الحد الأدنى لوقت الحجز',
            'الأوقات المحجوبة',
            'أنماط الوقت المسموحة',
            'الأوقات المحجوزة مسبقاً'
          ]
        },
        step3: {
          title: '3. قم بحجزك',
          description: 'بمجرد اختيار التاريخ والوقت، ستحتاج إلى:',
          items: [
            'إدخال اسمك (يجب أن يطابق الاسم المستخدم للدفع)',
            'تقديم رقم هاتفك',
            'التحقق من رقم هاتفك باستخدام رمز OTP'
          ]
        },
        step4: {
          title: '4. أكد حجزك',
          description: 'بعد الحجز الأولي:',
          items: [
            'مكانك محجوز مؤقتاً ولكن غير مؤكد',
            'ادفع رسم حجز تقريبا 1 دينار باستخدام كليك (القيمة بالضبط ستظهر بعد الحجز , يجب دفع القيمة بدقة لتأكيد الحجز التلقائي) منفصل عن رسوم الملعب',
            'أكمل الدفع خلال ساعة واحدة لتجنب الإلغاء التلقائي',
            'احصل على تأكيد الحجز من خلال واتساب عند التأكد من الدفع'
          ]
        },
        step5: {
          title: '5. أدر حجوزاتك',
          description: 'استخدم رابط "إدارة الحجز" في الصفحة الرئيسية لـ:',
          items: [
            'عرض حجوزاتك النشطة',
            'فحص حالة الحجز',
            'إلغاء الحجوزات عند الحاجة'
          ]
        }
      },
        
      // Footer
      footer: {
        copyright: '© {{year}} SportSpot. جميع الحقوق محفوظة.',
      },
    },
  }
};

i18next
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;