export type UserRole = 'student' | 'teacher' | 'admin'

export type User = { name: string; email: string; role: UserRole }

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Học viên',
  teacher: 'Giảng viên',
  admin: 'Quản trị viên',
}

export type Course = {
  id: string
  title: string
  description: string
  instructor: string
  instructorAvatar: string
  category: string
  categoryColor: string
  level: 'Cơ bản' | 'Trung cấp' | 'Nâng cao'
  rating: number
  reviewCount: number
  studentCount: number
  duration: string
  price: number
  originalPrice: number
  tags: string[]
  lessons: Lesson[]
}

export type Lesson = {
  id: string
  title: string
  duration: string
  videoId: string
  description: string
  videoScript: string[]
  keyPhrases: string[]
  isFree: boolean
  quiz: Quiz | null
  resources: Resource[]
}

export type Quiz = {
  title: string
  questions: Question[]
}

export type Question = {
  id: string
  text: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Resource = {
  title: string
  type: 'docs' | 'github' | 'pdf'
}

export type Comment = {
  id: string
  author: string
  initials: string
  avatarColor: string
  text: string
  time: string
  likes: number
  replies: Comment[]
}

export const COURSES: Course[] = [
  {
    id: 'giao-tiep',
    title: 'Tiếng Anh giao tiếp từ cơ bản đến tự tin',
    description:
      'Lộ trình giao tiếp tiếng Anh dành cho người mới bắt đầu, tập trung vào phản xạ nghe nói, mẫu câu thông dụng và tình huống thực tế hằng ngày.',
    instructor: 'Cô Mai Anh',
    instructorAvatar: 'MA',
    category: 'Giao tiếp',
    categoryColor: '#1066d6',
    level: 'Cơ bản',
    rating: 4.8,
    reviewCount: 1240,
    studentCount: 8500,
    duration: '24 giờ',
    price: 599000,
    originalPrice: 1299000,
    tags: ['Giao tiếp', 'Phản xạ', 'Ngữ âm', 'Từ vựng'],
    lessons: [
      {
        id: 'l1',
        title: 'Chào hỏi và giới thiệu bản thân',
        duration: '18:30',
        videoId: 'english-greetings-01',
        description:
          'Làm quen với mẫu câu chào hỏi, cách giới thiệu tên, nghề nghiệp và quốc tịch bằng tiếng Anh trong tình huống đời thường.',
        videoScript: [
          'Hello, my name is Lan. Nice to meet you.',
          'Hi Lan, I am Minh. I work in marketing.',
          'Where are you from?',
          'I am from Da Nang, and I am learning English for work.',
          'Great. Let us practice a natural greeting together.',
        ],
        keyPhrases: ['Nice to meet you', 'Where are you from?', 'I work in marketing', 'I am learning English'],
        isFree: true,
        quiz: {
          title: 'Quiz: Chào hỏi và giới thiệu bản thân',
          questions: [
            {
              id: 'q1',
              text: 'Câu nào phù hợp để giới thiệu tên bằng tiếng Anh?',
              options: [
                'My name is Lan.',
                'I name Lan.',
                'Name me Lan.',
                'Lan is name.',
              ],
              correctIndex: 0,
              explanation:
                'My name is ... là câu giới thiệu tên tự nhiên và phổ biến nhất trong giao tiếp cơ bản.',
            },
            {
              id: 'q2',
              text: 'Khi gặp ai lần đầu, bạn có thể hỏi điều gì?',
              options: ['How are you?', 'Where yesterday?', 'Can name?', 'You old?'],
              correctIndex: 0,
              explanation: 'How are you? là câu hỏi lịch sự, để mở đầu cuộc trò chuyện đơn giản.',
            },
            {
              id: 'q3',
              text: 'Cách trả lời tự nhiên cho câu hỏi How are you? là gì?',
              options: [
                'I am fine, thank you.',
                'I am engineer thank you.',
                'I fine name Lan.',
                'Fine old twenty.',
              ],
              correctIndex: 0,
              explanation:
                'I am fine, thank you. là câu trả lời ngắn gọn, lịch sự và đúng ngữ cảnh giao tiếp cơ bản.',
            },
          ],
        },
        resources: [
          { title: 'Bảng mẫu câu chào hỏi cơ bản', type: 'docs' },
          { title: 'File PDF từ vựng giới thiệu bản thân', type: 'pdf' },
        ],
      },
      {
        id: 'l2',
        title: 'Hỏi thông tin cá nhân trong hội thoại ngắn',
        duration: '22:15',
        videoId: 'english-personal-info-02',
        description:
          'Học cách hỏi tên, quê quán, công việc và sở thích bằng mẫu câu đơn giản để duy trì cuộc trò chuyện.',
        videoScript: [
          'What do you do?',
          'I am a university student and I love photography.',
          'Where do you live now?',
          'I live in Ho Chi Minh City with my family.',
          'Those simple questions help you keep a conversation going.',
        ],
        keyPhrases: ['What do you do?', 'Where do you live?', 'I love photography', 'Keep a conversation going'],
        isFree: false,
        quiz: null,
        resources: [],
      },
      {
        id: 'l3',
        title: 'Luyện nghe nói trong tình huống ở quán cà phê',
        duration: '28:40',
        videoId: 'english-coffee-shop-03',
        description:
          'Áp dụng câu hỏi và câu trả lời khi gọi đồ uống, xác nhận thông tin và phản hồi lịch sự bằng tiếng Anh.',
        videoScript: [
          'Can I get a hot latte, please?',
          'Sure. What size would you like?',
          'A medium latte, please.',
          'Would you like anything else?',
          'No, thank you. That is all.',
        ],
        keyPhrases: ['Can I get...', 'What size would you like?', 'Anything else?', 'That is all'],
        isFree: false,
        quiz: null,
        resources: [],
      },
      {
        id: 'l4',
        title: 'Tổng hợp hội thoại giao tiếp hằng ngày',
        duration: '31:05',
        videoId: 'english-daily-conversation-04',
        description:
          'Thực hành một đoạn hội thoại hoàn chỉnh kết hợp chào hỏi, giới thiệu, hỏi thông tin và kết thúc lịch sự.',
        videoScript: [
          'Good morning. My name is Hoa, and I am new here.',
          'Welcome, Hoa. What department are you in?',
          'I am in customer service. How about you?',
          'I work in sales. Let us have lunch sometime.',
          'That sounds great. See you later.',
        ],
        keyPhrases: ['Good morning', 'I am new here', 'How about you?', 'See you later'],
        isFree: false,
        quiz: null,
        resources: [],
      },
    ],
  },
  {
    id: 'toeic',
    title: 'Luyện TOEIC 650+ theo từng dạng bài',
    description:
      'Khóa học luyện TOEIC tập trung vào Listening và Reading, giúp nắm chắc từ vựng, ngữ pháp và chiến thuật làm bài để tăng điểm nhanh.',
    instructor: 'Thầy Đức Bảo',
    instructorAvatar: 'DB',
    category: 'Luyện thi',
    categoryColor: '#16a34a',
    level: 'Trung cấp',
    rating: 4.7,
    reviewCount: 890,
    studentCount: 5200,
    duration: '20 giờ',
    price: 699000,
    originalPrice: 1499000,
    tags: ['TOEIC', 'Listening', 'Reading', 'Ngữ pháp'],
    lessons: [
      {
        id: 'l1',
        title: 'TOEIC Listening Part 2: Hỏi đáp ngắn',
        duration: '20:00',
        videoId: 'toeic-listening-part2-01',
        description: 'Luyện nghe câu hỏi ngắn và chọn đáp án phù hợp theo ngữ cảnh trong TOEIC Listening Part 2.',
        videoScript: [
          'Where is the nearest bus stop?',
          'It is right across from the bank.',
          'Try to listen for location words and key nouns.',
          'Do not choose answers that only sound similar.',
        ],
        keyPhrases: ['Where is...', 'Across from', 'Key nouns', 'Avoid similar sounds'],
        isFree: true,
        quiz: null,
        resources: [],
      },
      {
        id: 'l2',
        title: 'TOEIC Reading Part 5: Hoàn thành câu',
        duration: '25:30',
        videoId: 'toeic-reading-part5-02',
        description: 'Rèn cách nhận diện từ loại, cấu trúc ngữ pháp và collocation thường gặp trong TOEIC Part 5.',
        videoScript: [
          'First, identify what kind of word is missing in the blank.',
          'Second, check grammar clues before and after the blank.',
          'Third, eliminate options that do not fit the sentence structure.',
          'This method helps you answer faster and more accurately.',
        ],
        keyPhrases: ['Word type', 'Grammar clues', 'Eliminate options', 'Answer faster'],
        isFree: false,
        quiz: null,
        resources: [],
      },
    ],
  },
  {
    id: 'thuong-mai',
    title: 'Tiếng Anh thương mại và giao tiếp công sở',
    description:
      'Phát triển kỹ năng viết email, họp online, thuyết trình và giao tiếp với khách hàng bằng tiếng Anh chuyên nghiệp.',
    instructor: 'Cô Hà Linh',
    instructorAvatar: 'SL',
    category: 'Công việc',
    categoryColor: '#d97706',
    level: 'Trung cấp',
    rating: 4.9,
    reviewCount: 2100,
    studentCount: 12000,
    duration: '32 giờ',
    price: 799000,
    originalPrice: 1699000,
    tags: ['Email', 'Họp trực tuyến', 'Thuyết trình', 'Công sở'],
    lessons: [
      {
        id: 'l1',
        title: 'Viết email công việc rõ ràng và lịch sự',
        duration: '22:00',
        videoId: 'business-english-email-01',
        description: 'Học cấu trúc email, cách mở đầu, đề xuất, xác nhận và kết thúc email bằng tiếng Anh chuyên nghiệp.',
        videoScript: [
          'Dear Ms. Anna, I am writing to confirm our meeting on Friday.',
          'Could we move the meeting to 2 p.m. instead?',
          'Please let me know if the new time works for you.',
          'Best regards, Minh Tran.',
        ],
        keyPhrases: ['I am writing to...', 'Could we...', 'Please let me know', 'Best regards'],
        isFree: true,
        quiz: null,
        resources: [],
      },
    ],
  },
  {
    id: 'phat-am',
    title: 'Phát âm tiếng Anh chuẩn và dễ nghe hơn',
    description:
      'Sửa lỗi phát âm phổ biến, luyện trọng âm, nối âm và ngữ điệu để tăng độ rõ ràng khi giao tiếp tiếng Anh.',
    instructor: 'Thầy Minh Khang',
    instructorAvatar: 'EC',
    category: 'Phát âm',
    categoryColor: '#9333ea',
    level: 'Cơ bản',
    rating: 4.6,
    reviewCount: 650,
    studentCount: 3800,
    duration: '18 giờ',
    price: 549000,
    originalPrice: 1199000,
    tags: ['Phát âm', 'Ngữ điệu', 'Trọng âm', 'Nghe nói'],
    lessons: [
      {
        id: 'l1',
        title: 'Phân biệt âm /i:/ và /i/',
        duration: '16:00',
        videoId: 'pronunciation-i-ee-01',
        description: 'Luyện cách nghe và phát âm hai âm dễ nhầm lẫn trong các cặp từ phổ biến hằng ngày.',
        videoScript: [
          'Sheep has the long sound /i:/.',
          'Ship has the short sound /i/.',
          'Listen carefully and repeat after me.',
          'Sheep, ship. Leave, live. Seat, sit.',
        ],
        keyPhrases: ['Long sound /i:/', 'Short sound /i/', 'Repeat after me', 'Sheep and ship'],
        isFree: true,
        quiz: null,
        resources: [],
      },
    ],
  },
]

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: 'Hoang Giang',
    initials: 'HG',
    avatarColor: '#1066d6',
    text: 'Phần mẫu câu giới thiệu bản thân rất dễ áp dụng. Mình đã tập nói theo và thấy tự tin hơn hẳn.',
    time: '2 giờ trước',
    likes: 14,
    replies: [
      {
        id: 'c1-r1',
        author: 'Cô Mai Anh',
        initials: 'MA',
        avatarColor: '#7c3aed',
        text: 'Rất tốt. Bạn thử ghi âm đoạn giới thiệu của mình và đăng lên đây, cô sẽ góp ý thêm cho bạn.',
        time: '1 giờ trước',
        likes: 5,
        replies: [],
      },
    ],
  },
  {
    id: 'c2',
    author: 'Tuan Bui',
    initials: 'TB',
    avatarColor: '#16a34a',
    text: 'Cho em hỏi TOEIC Listening Part 2 có mẹo nào để tránh bẫy từ gần âm không ạ?',
    time: '5 giờ trước',
    likes: 3,
    replies: [
      {
        id: 'c2-r1',
        author: 'Lê Bảo',
        initials: 'LB',
        avatarColor: '#d97706',
        text: 'Bạn nên nghe từ khóa chính trong câu hỏi rồi loại dần đáp án sai theo ngữ cảnh thay vì nghe từng từ rời rạc.',
        time: '4 giờ trước',
        likes: 7,
        replies: [],
      },
    ],
  },
  {
    id: 'c3',
    author: 'Dieu Khanh',
    initials: 'DK',
    avatarColor: '#0891b2',
    text: 'Quiz cuối bài khá hay, làm xong mới thấy mình nhầm khá nhiều ở phần từ vựng và câu trả lời ngắn.',
    time: '1 ngày trước',
    likes: 22,
    replies: [],
  },
]
