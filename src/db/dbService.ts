import fs from 'fs';
import path from 'path';
import { Game, User, Bookmark, BrokenReport, Tag, GameRequest } from '../types';

const DB_DIR = typeof __dirname !== 'undefined'
  ? path.join(__dirname, '../../data')
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

let defaultData: any = null;
let memoryDb: any = null;

// Helper to secure directory existence
const ensureDbExists = () => {
  const initialData = {
      users: [
        {
          id: 'admin-therum',
          username: 'therum',
          email: 'therum@admin.com',
          // Plain text password for simplicity in presentation/testing or mocked hashing. 
          // We will handle comparison via plain/simple hash.
          password: 'admin',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
        },
        {
          id: 'user-sample',
          username: 'vn_lover',
          email: 'vn_lover@gmail.com',
          password: 'user123',
          role: 'user',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
        }
      ],
      games: [
        {
          id: 'game-1',
          title: 'Yosuga no Sora (Duyên Vị Trời Cao)',
          slug: 'yosuga-no-sora',
          shortDescription: 'Một tác phẩm Visual Novel tình cảm lãng mạn đầy cảm xúc xoay quanh cuộc sống đầy biến động của anh em nhà Kasugano tại ngôi làng yên bình Okusome.',
          description: `### Giới thiệu
**Yosuga no Sora** là một visual novel Nhật Bản được phát triển bởi **Sphere**. Trò chơi có cấu trúc chương, trong đó người chơi sẽ theo dõi câu chuyện của nhân vật chính là Haruka Kasugano và những lựa chọn của anh với nhiều nữ chính khác nhau, bao gồm cả người em song sinh Sora Kasugano. 

Bản dịch Việt hóa hoàn chỉnh được thực hiện tỉ mỉ bởi nhóm dịch **TheRum**, truyền tải trọn vẹn những thông điệp tinh tế, những cung bậc cảm xúc sầu bi, ấm áp của câu chuyện gốc.

### Các tính năng nổi bật:
* **Cơ chế cốt truyện phân nhánh:** Khám phá nhiều tuyến nhân vật (Route) đầy kịch tính và ý nghĩa sâu sắc.
* **Đồ họa tuyệt hảo:** Phong cách nghệ thuật cổ điển, thiết kế nhân vật tinh xảo và cảnh nền vẽ tay tuyệt đẹp.
* **Nhạc nền đỉnh cao (OST):** Những giai điệu piano, violin du dương gây ấn tượng mạnh mẽ cho người chơi, tiêu biểu là ca khúc *Old Memory*.
* **Bản dịch Việt hóa chất lượng:** Được hiệu đính kỹ lưỡng từng câu chữ tiếng Việt tự nhiên, Việt hóa cả đồ họa trong game.`,
          coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&h=600&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&h=400&q=80',
          creator: 'TheRum',
          developer: 'Sphere',
          publisher: 'Sphere',
          status: 'Hoàn thành',
          engine: 'KiriKiri',
          platforms: ['Windows', 'Android'],
          ageRating: '18+',
          viewsCount: 1520,
          downloadsCount: 543,
          bookmarksCount: 92,
          tags: ['Romance', 'Drama', 'Slice of Life', 'Chương Trình Việt Hóa'],
          downloadLinks: [
            { label: 'Google Drive (Bản Windows)', url: 'https://drive.google.com/drive/folders/placeholder1', password: 'therumvn-windows' },
            { label: 'Fshare (Bản Windows)', url: 'https://www.fshare.vn/folder/placeholder_win' },
            { label: 'Google Drive (Bản Android)', url: 'https://drive.google.com/drive/folders/placeholder2', password: 'therumvn-android' }
          ],
          changelogs: [
            { version: 'v1.1', date: '2026-02-15', content: 'Sửa một số lỗi font chữ hiển thị trên Android 14. Tối ưu dung lượng hình ảnh.' },
            { version: 'v1.0', date: '2025-11-20', content: 'Ra mắt đầu tiên bản patch Việt hóa hoàn chỉnh 100% cho PC và Android.' }
          ],
          screenshots: [
            'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&h=450&q=80',
            'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=800&h=450&q=80',
            'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&h=450&q=80'
          ],
          createdAt: '2025-11-20T10:00:00Z',
          updatedAt: '2026-02-15T08:30:00Z'
        },
        {
          id: 'game-2',
          title: 'Fate/stay night [Realta Nua]',
          slug: 'fate-stay-night-realta-nua',
          shortDescription: 'Cuộc chiến Chén Thánh giữa 7 Master và 7 Servant huyền thoại. Một trong những visual novel có tầm ảnh hưởng lớn nhất mọi thời đại.',
          description: `### Giới thiệu
**Fate/stay night** là tác phẩm visual novel đỉnh cao của hãng **TYPE-MOON**, phác họa nên cuộc chiến tranh giành sinh tử khốc liệt được biết đến dưới tên gọi "Cuộc chiến Chén Thánh". Shirou Emiya, một nam sinh trung học vô tình bị kéo vào trận chiến sinh tử này và triệu hồi được Saber, Servant mạnh mẽ nhất.

Dự án Việt hóa **Fate/stay night [Realta Nua]** của nhóm **TheRum** hiện đã dịch thành công 100% tuyến đường Fate (Saber Route) và Unlimited Blade Works (Rin Route), hiện đang thực hiện dịch nốt 85% tuyến Heaven's Feel (Sakura Route).

### Các đặc trưng:
* **Tác phẩm đồ sộ:** Kịch bản sâu sắc có chiều dài tương đương nhiều bộ tiểu thuyết gộp lại.
* **Hệ thống nhân vật huyền thoại:** Saber, Archer, Gilgamesh, Rin Tohsaka... đã trở thành biểu tượng văn hóa đại chúng.
* **Chiến đấu đỉnh cao:** Các đoạn mô tả kịch tính cùng kỹ xảo ấn tượng mang đến bầu không khí nghẹt thở.`,
          coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&h=600&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=400&q=80',
          creator: 'TheRum',
          developer: 'TYPE-MOON',
          publisher: 'TYPE-MOON',
          status: 'Đang dịch',
          engine: 'KiriKiri',
          platforms: ['Windows'],
          ageRating: '16+',
          viewsCount: 3120,
          downloadsCount: 1105,
          bookmarksCount: 240,
          tags: ['Action', 'Fantasy', 'Mystery', 'Đặc Sắc'],
          downloadLinks: [
            { label: 'Google Drive (Patch Việt Hóa v0.85)', url: 'https://drive.google.com/drive/folders/placeholder3', password: 'therum-fatestay' }
          ],
          changelogs: [
            { version: 'v0.85', date: '2026-04-10', content: 'Hoàn thành dịch 85% Sakura Route. Sửa lỗi chính tả tuyến UBW.' },
            { version: 'v0.60', date: '2025-08-01', content: 'Hoàn thành trọn vẹn tuyến Saber và Rin Route.' }
          ],
          screenshots: [
            'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&h=450&q=80',
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&h=450&q=80'
          ],
          createdAt: '2025-08-01T12:00:00Z',
          updatedAt: '2026-04-10T14:45:00Z'
        },
        {
          id: 'game-3',
          title: 'Steins;Gate (Cổng Khoa Học Viễn Tưởng)',
          slug: 'steins-gate',
          shortDescription: 'Câu chuyện du hành thời gian của nhà khoa học điên Okabe Rintaro. Liệu anh có thể thay đổi số phận đau thương của những người bạn thân thương?',
          description: `### Giới thiệu
**Steins;Gate** là dự án thuộc sê-ri Science Adventure của hãng **5pb.** và **Nitroplus**. Game theo chân Okabe Rintaro, một kẻ tự xưng là nhà khoa học điên phụ trách phòng nghiên cứu tiện ích tương lai cùng nhóm bạn lập dị. Ngày nọ, họ vô tình chế tạo thành công một lò vi sóng gửi được tin nhắn về quá khứ, khởi đầu chuỗi nghịch lý thời gian và âm mưu đen tối của tổ chức SERN.

Bản dịch do **TheRum** đóng gói dạng Patch tích hợp sẵn, dễ cài đặt trên Steam hoặc bản Crack, mang lại trải nghiệm đầy thuyết phục với hệ thống thuật ngữ khoa học vũ trụ, hội họa và otaku được dịch cực kỳ thuần Việt.

### Đặc điểm nổi bật:
* **Cơ chế Phone Trigger:** Tương tác, đổi hướng cốt truyện bằng cách nhận cuộc gọi hoặc SMS của điện thoại.
* **Cốt truyện logic siêu đẳng:** Hệ thống giả thuyết khoa học sâu, đan cài tình tiết vô cùng chặt chẽ.
* **Thời lượng đồ sộ:** Hơn 40 giờ chơi ngập tràn cảm xúc đỉnh cao.`,
          coverUrl: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?auto=format&fit=crop&w=400&h=600&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&h=400&q=80',
          creator: 'TheRum',
          developer: 'Mages / 5pb.',
          publisher: 'Spike Chunsoft',
          status: 'Hoàn thành',
          engine: 'Unity',
          platforms: ['Windows', 'Android', 'WebHTML5'],
          ageRating: '15+',
          viewsCount: 2450,
          downloadsCount: 890,
          bookmarksCount: 165,
          tags: ['Sci-Fi', 'Psychological', 'Thriller', 'Hoàn Thành'],
          downloadLinks: [
            { label: 'Google Drive (Full Game Việt Hóa)', url: 'https://drive.google.com/drive/folders/placeholder-sg' }
          ],
          changelogs: [
            { version: 'v1.0', date: '2026-01-05', content: 'Bản dịch chính thức phát hành.' }
          ],
          screenshots: [
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=450&q=80'
          ],
          createdAt: '2026-01-05T09:00:00Z',
          updatedAt: '2026-01-05T09:00:00Z'
        },
        {
          id: 'game-4',
          title: 'The House in Fata Morgana (Ngôi Nhà Ở Fata Morgana)',
          slug: 'the-house-in-fata-morgana',
          shortDescription: 'Mở ra cánh cửa của ngôi biệt thự cổ kính u ám, hồi tưởng lại các bi kịch trải dài hàng trăm năm lịch sử để tìm lại danh tính của chính bạn.',
          description: `### Giới thiệu
**The House in Fata Morgana** là một câu chuyện bi kịch Gothic đầy ám ảnh xoay quanh một linh hồn mất trí nhớ thức tỉnh trong một dinh thự đổ nát. Được dẫn dắt bởi một Nữ hầu kỳ bí (The Maid), linh hồn này phải chứng kiến 4 chuỗi bi kịch sảy ra với các thế hệ gia chủ khác nhau ở những thế kỷ trước để thấu hiểu về bản ngã và nỗi oán hận thâm sâu đang bóp nghẹt dinh thự.

Tác phẩm được cả giới phê bình đánh giá 10/10 điểm trên Steam. Bản dịch Việt ngữ được **TheRum** dụng tâm chuẩn hóa văn phong Gothic trung cổ nhã nhặn, đầy nghệ thuật.

### Bi kịch sâu sắc:
* **Văn phong cổ điển:** Mang đậm màu sắc văn học châu Âu thời Trung cổ, vừa lộng lẫy vừa đau đớn.
* **Thiết kế nghệ thuật độc đáo:** Trực quan khác biệt hẳn so với các Visual Novel thông thường, đậm tính hình tượng cao.
* **Nhạc nền vô song:** Hơn 65 ca khúc có lời mang phong cách hát tế, sử ca đầy mê hoặc lòng người.`,
          coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&h=600&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&h=400&q=80',
          creator: 'TheRum',
          developer: 'Novectacle',
          publisher: 'Novectacle',
          status: 'Hoàn thành',
          engine: 'KiriKiri',
          platforms: ['Windows', 'macOS'],
          ageRating: '18+',
          viewsCount: 1890,
          downloadsCount: 654,
          bookmarksCount: 135,
          tags: ['Mystery', 'Gothic', 'Tragedy', 'Hoàn Thành'],
          downloadLinks: [
            { label: 'Google Drive (Full PC Việt Hóa)', url: 'https://drive.google.com/drive/folders/placeholder-fm', password: 'therum-fata' }
          ],
          changelogs: [
            { version: 'v1.0', date: '2025-12-15', content: 'Phát hành bản dịch tương thích hoàn hảo bản Steam.' }
          ],
          screenshots: [
            'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&h=450&q=80'
          ],
          createdAt: '2025-12-15T07:12:00Z',
          updatedAt: '2025-12-15T07:12:00Z'
        },
        {
          id: 'game-5',
          title: 'Katawa Shoujo (Những Cô Gái Khuyết Tật)',
          slug: 'katawa-shoujo',
          shortDescription: 'Một visual novel lay động lòng người lấy bối cảnh tại học viện Yamaku dành cho trẻ em khuyết tật.',
          description: `### Giới thiệu
**Katawa Shoujo** kể về Hisao Nakai, một nam sinh trẻ tuổi có cuộc sống hoàn toàn xáo trộn sau khi phát hiện mắc hội chứng rối loạn nhịp tim bẩm sinh. Cậu buộc phải chuyển đến Học viện Yamaku – một ngôi trường chuyên biệt dành cho những học sinh khuyết tật. Tại đây cậu dần kết bạn, thấu hiểu cuộc đời của 5 nữ sinh khác nhau, mỗi người mang một khiếm khuyết cơ thể nhưng đầy ước vọng tươi đẹp.

Thương hiệu Việt hóa độc quyền của **TheRum** với lối dịch bình dị, đầy sự mộc mạc và chân thực giúp bạn cảm nhận sâu sắc những nỗi đau, hy vọng của các nhân vật.

### Giá trị nghệ thuật:
* **Phong thái tối giản:** Nhẹ nhàng, súc tích, mang ý nghĩa giáo dục giáo dục thể chất sâu sắc.
* **Tôn trọng nhân sinh:** Khai thác đề tài nhạy cảm một cách tôn trọng, tinh tế đến xúc động.
* **Route đa dạng:** Mỗi route mở ra một lát cắt cuộc đời lôi cuốn đầy ắp niềm tin.`,
          coverUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&h=600&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&h=400&q=80',
          creator: 'TheRum',
          developer: 'Four Leaf Studios',
          publisher: 'Four Leaf Studios',
          status: 'Hoàn thành',
          engine: 'RenPy',
          platforms: ['Windows', 'Android', 'macOS'],
          ageRating: '18+',
          viewsCount: 1430,
          downloadsCount: 520,
          bookmarksCount: 88,
          tags: ['Romance', 'Drama', 'Slice of Life', 'Chương Trình Việt Hóa'],
          downloadLinks: [
            { label: 'Google Drive (Bản PC/Android/MacOS)', url: 'https://drive.google.com/drive/folders/placeholder-ks' }
          ],
          changelogs: [
            { version: 'v1.2', date: '2026-03-01', content: 'Cập nhật patch sửa lỗi dịch thuật một số hội thoại.' }
          ],
          screenshots: [
            'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&h=450&q=80'
          ],
          createdAt: '2025-10-10T11:00:00Z',
          updatedAt: '2026-03-01T05:00:00Z'
        },
        {
          id: 'game-6',
          title: 'Doki Doki Literature Club! (Câu Lạc Bộ Văn Học Lâm Ly)',
          slug: 'doki-doki-literature-club',
          shortDescription: 'Một câu lạc bộ văn học tràn ngập những cô gái dễ thương đang chờ đợi bạn gia nhập. Liệu đây có thực sự là một Dating Sim thông thường?',
          description: `### Giới thiệu
Chào mừng đến với Câu lạc bộ Văn học! Đây được coi là một game hẹn hò cực kỳ thơ mộng dễ thương, thách thức độ nhạy cảm của bạn qua từng bài thơ... Thế nhưng ẩn sau vỏ bọc thanh thuần là một trong những tựa game kinh dị tâm lý, phá vỡ bức tường thứ tư (Fourth Wall Breaking) đột phá nhất lịch sử.

Bản Việt hóa cực kỳ tinh quái, dí dỏm bằng tiếng Việt sinh động do **TheRum** biên dịch sẽ dắt bạn vượt qua những bất ngờ thót tim, rung động tới gai người.

### Lưu ý quan trọng:
* **Game có chứa yếu tố kinh dị:** Có thể gây lo lắng nhẹ hoặc ám ảnh tâm lý cực đoan. Không dành cho người dưới 15 tuổi hoặc có tâm lý yếu.
* **Phá vỡ bức tường thứ tư:** Game sẽ liên tục can thiệp trực tiếp vào file hệ thống trong máy tính của bạn để tương tác. Hãy chuẩn bị tinh thần!`,
          coverUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&h=600&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&h=400&q=80',
          creator: 'TheRum',
          developer: 'Team Salvato',
          publisher: 'Team Salvato',
          status: 'Hoàn thành',
          engine: 'RenPy',
          platforms: ['Windows', 'Android'],
          ageRating: '16+',
          viewsCount: 4210,
          downloadsCount: 1890,
          bookmarksCount: 382,
          tags: ['Horror', 'Psychological', 'School Life', 'Đặc Sắc'],
          downloadLinks: [
            { label: 'Google Drive (Game Việt Hóa Sẵn)', url: 'https://drive.google.com/drive/folders/placeholder-ddlc' }
          ],
          changelogs: [
            { version: 'v1.0', date: '2025-09-01', content: 'Ra mắt trọn bộ Việt hóa hoàn chỉnh.' }
          ],
          screenshots: [
            'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&w=800&h=450&q=80'
          ],
          createdAt: '2025-09-01T08:00:00Z',
          updatedAt: '2025-09-01T08:00:00Z'
        }
      ],
      bookmarks: [],
      brokenReports: [],
      tags: [
        { id: 't1', name: 'Romance', slug: 'romance', type: 'genre' },
        { id: 't2', name: 'Drama', slug: 'drama', type: 'genre' },
        { id: 't3', name: 'Slice of Life', slug: 'slice-of-life', type: 'genre' },
        { id: 't4', name: 'Action', slug: 'action', type: 'genre' },
        { id: 't5', name: 'Fantasy', slug: 'fantasy', type: 'genre' },
        { id: 't6', name: 'Mystery', slug: 'mystery', type: 'genre' },
        { id: 't7', name: 'Sci-Fi', slug: 'sci-fi', type: 'genre' },
        { id: 't8', name: 'Psychological', slug: 'psychological', type: 'genre' },
        { id: 't9', name: 'Thriller', slug: 'thriller', type: 'genre' },
        { id: 't10', name: 'Gothic', slug: 'gothic', type: 'genre' },
        { id: 't11', name: 'Tragedy', slug: 'tragedy', type: 'genre' },
        { id: 't12', name: 'Horror', slug: 'horror', type: 'genre' },
        { id: 't13', name: 'School Life', slug: 'school-life', type: 'genre' },
        { id: 't14', name: 'Chương Trình Việt Hóa', slug: 'chuong-trinh-viet-hoa', type: 'status' },
        { id: 't15', name: 'Đặc Sắc', slug: 'dac-sac', type: 'feature' },
        { id: 't16', name: 'Hoàn Thành', slug: 'hoan-thanh', type: 'status' }
      ]
    };

    defaultData = initialData;

    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      }
    } catch (err) {
      console.warn("Warning: Failed to ensure database directory or file exists:", err);
    }
};

export const db = {
  getData: () => {
    ensureDbExists();
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn("Warning: Failed to read database from disk, using memory fallback:", err);
    }
    return memoryDb || defaultData;
  },

  saveData: (data: any) => {
    memoryDb = data;
    ensureDbExists();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn("Warning: Failed to write database to disk (read-only filesystem):", err);
    }
  },

  // Users Helpers
  getUsers: (): User[] => db.getData().users || [],
  saveUsers: (users: User[]) => {
    const data = db.getData();
    data.users = users;
    db.saveData(data);
  },
  addUser: (user: User) => {
    const data = db.getData();
    data.users.push(user);
    db.saveData(data);
  },

  // Games Helpers
  getGames: (): Game[] => db.getData().games || [],
  saveGames: (games: Game[]) => {
    const data = db.getData();
    data.games = games;
    db.saveData(data);
  },
  addGame: (game: Game) => {
    const data = db.getData();
    data.games.push(game);
    db.saveData(data);
  },

  // Bookmarks Helpers
  getBookmarks: (): Bookmark[] => db.getData().bookmarks || [],
  saveBookmarks: (bookmarks: Bookmark[]) => {
    const data = db.getData();
    data.bookmarks = bookmarks;
    db.saveData(data);
  },

  // Reports Helpers
  getBrokenReports: (): BrokenReport[] => db.getData().brokenReports || [],
  saveBrokenReports: (reports: BrokenReport[]) => {
    const data = db.getData();
    data.brokenReports = reports;
    db.saveData(data);
  },

  // Tags Helpers
  getTags: (): Tag[] => db.getData().tags || [],

  // Config Helpers
  getFilterConfig: () => {
    const data = db.getData();
    const DEFAULT_GENRES = [
      'Romance', 'Drama', 'Slice of Life', 'Action', 'Fantasy', 'Mystery', 
      'Sci-Fi', 'Psychological', 'Thriller', 'Gothic', 'Tragedy', 'Horror', 'School Life'
    ];
    const DEFAULT_ENGINES = ['RenPy', 'KiriKiri', 'Unity', 'RPG Maker', 'TyranoBuilder'];
    const DEFAULT_PLATFORMS = ['Windows', 'Android', 'macOS', 'iOS', 'WebHTML5'];
    
    return {
      genres: data.genres || DEFAULT_GENRES,
      engines: data.engines || DEFAULT_ENGINES,
      platforms: data.platforms || DEFAULT_PLATFORMS
    };
  },
  saveFilterConfig: (config: { genres?: string[], engines?: string[], platforms?: string[] }) => {
    const data = db.getData();
    if (config.genres) data.genres = config.genres;
    if (config.engines) data.engines = config.engines;
    if (config.platforms) data.platforms = config.platforms;
    db.saveData(data);
  },

  // Game Requests Helpers
  getGameRequests: (): GameRequest[] => db.getData().gameRequests || [],
  saveGameRequests: (requests: GameRequest[]) => {
    const data = db.getData();
    data.gameRequests = requests;
    db.saveData(data);
  }
};
