import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Common
      common: {
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
        cooldown: 'Please wait {{seconds}} seconds before requesting another code',
        status: {
          label: 'Status',
          active: 'Active',
          cancelled: 'Cancelled',
          paid: 'Paid',
          waitingPayment: 'Waiting Payment',
          noPayment: 'No Payment',
          userCancelled: 'User Cancelled',
          adminCancelled: 'Admin Cancelled'
        },
        error: {
          selectDates: 'Please select both from and to dates',
          invalidDateRange: 'From date must be before or equal to to date',
          loadField: 'Failed to load field data. Please try again.',
          loadReservations: 'Failed to load reservations. Please try again.'
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
        myFields: 'My Fields',
        subscribedFields: 'Subscribed Fields',
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
        nameHelp: 'This name will be used to verify your cliq payment for reservations',
        secondaryPhone: 'Secondary Phone',
        secondaryPhoneHelp: 'Optional secondary contact number'
      },

      // Field Details
      field: {
        name: 'Field Name',
        sportType: 'Sport Type',
        location: 'Location',
        district: 'District',
        districtPlaceholder: 'Select District',
        price: 'Price',
        pricePerHour: '{{price}}/hour',
        minBookingTime: 'Minimum Booking Time',
        includedServices: 'Included Services',
        images: 'Field Images',
        timePattern: 'Time Pattern',
        blockedTimes: 'Blocked Times',
        reservations: 'Reservations',
        addField: 'Add New Field',
        editField: 'Edit Field',
        deleteField: 'Delete Field',
        confirmDelete: 'Are you sure you want to delete this field?',
        deleteWarning: 'Are you sure you want to delete this field? This action cannot be undone.',
        noFields: 'You don\'t have any fields yet. Click "Add New Field" to create one.',
        addTimeBlock: 'Add Time Block'
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
        reserverName: 'Name (will be used to verify cliq payment)',
        reserverPhone: 'Phone Number',
        phoneHelp: 'Must be a Jordanian phone number (07xxxxxxxx)',
        selectedSlot: 'Selected Time Slot',
        success: 'Reservation Confirmed!',
        successMessage: 'Your reservation has been successfully confirmed. You will receive a confirmation message shortly.',
        reservationId: 'Reservation ID',
        cancelInfo: 'You can cancel this reservation up to 12 hours before the start time by visiting the Manage Reservation page.',
        cancelNotice: 'Important: Reservations must be cancelled at least 12 hours before the start time.',
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
        totalPrice: 'Total Price',
        selectDateRange: 'Select a date range to view reservations'
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
        cooldown: 'يرجى الانتظار {{seconds}} ثانية قبل طلب رمز آخر',
        status: {
          label: 'الحالة',
          active: 'نشط',
          cancelled: 'ملغي',
          paid: 'مدفوع',
          waitingPayment: 'في انتظار الدفع',
          noPayment: 'بدون دفع',
          userCancelled: 'ألغاه المستخدم',
          adminCancelled: 'ألغاه المدير'
        },
        error: {
          selectDates: 'يرجى اختيار تاريخ البداية والنهاية',
          invalidDateRange: 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية',
          loadField: 'فشل في تحميل بيانات الملعب. يرجى المحاولة مرة أخرى.',
          loadReservations: 'فشل في تحميل الحجوزات. يرجى المحاولة مرة أخرى.'
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
        myFields: 'ملاعبي',
        subscribedFields: 'ملاعبنا',
        howItWorks: 'كيف يعمل'
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
        name: 'الاسم',
        nameHelp: 'سيتم استخدام هذا الاسم للتحقق من دفع كليك للحجوزات',
        secondaryPhone: 'الهاتف الثانوي',
        secondaryPhoneHelp: 'رقم اتصال ثانوي اختياري'
      },

      // Field Details
      field: {
        name: 'اسم الملعب',
        sportType: 'نوع الرياضة',
        location: 'الموقع',
        district: 'المنطقة',
        districtPlaceholder: 'اختر المنطقة',
        price: 'السعر',
        pricePerHour: '{{price}}/ساعة',
        minBookingTime: 'الحد الأدنى لمدة الحجز',
        includedServices: 'الخدمات المشمولة',
        images: 'صور الملعب',
        timePattern: 'نمط الوقت',
        blockedTimes: 'الأوقات الممنوعة',
        reservations: 'الحجوزات',
        addField: 'إضافة ملعب جديد',
        editField: 'تعديل الملعب',
        deleteField: 'حذف الملعب',
        confirmDelete: 'هل أنت متأكد من حذف هذا الملعب؟',
        deleteWarning: 'هل أنت متأكد من حذف هذا الملعب؟ لا يمكن التراجع عن هذا الإجراء.',
        noFields: 'ليس لديك أي ملاعب حتى الآن. انقر على "إضافة ملعب جديد" لإنشاء واحد.',
        addTimeBlock: 'إضافة فترة زمنية'
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
        reserverName: '(سوف يستخدم للتحقق من الدفع عن طريق كليك)الاسم ',
        reserverPhone: 'رقم الهاتف',
        phoneHelp: 'يجب أن يكون رقم هاتف أردني (07xxxxxxxx)',
        selectedSlot: 'الوقت المختار',
        success: 'تم تأكيد الحجز!',
        successMessage: 'تم تأكيد حجزك بنجاح. سوف تتلقى رسالة تأكيد قريباً.',
        reservationId: 'رقم الحجز',
        cancelInfo: 'يمكنك إلغاء هذا الحجز قبل 12 ساعة من وقت البدء عن طريق زيارة صفحة إدارة الحجوزات.',
        cancelNotice: 'هام: يجب إلغاء الحجوزات قبل 12 ساعة على الأقل من وقت البدء.',
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
        totalPrice: 'السعر الإجمالي',
        selectDateRange: 'اختر نطاق تاريخ لعرض الحجوزات'
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