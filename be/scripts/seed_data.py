"""
Seed script for Shrota Audiobook App
Creates dummy data for testing:
- 3 Languages
- 5 Genres
- 10 Authors
- 10 Artists
- 10 Publications
- 50 Books (each with 2-6 chapters)

Run: docker exec shrota-backend-dev python scripts/seed_data.py
"""

import asyncio
import random
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import async_session, init_db, close_db
from models import Language, Genre, Author, Artist, Publication, Book, Chapter


# =============================================================================
# AVAILABLE AUDIO FILES (will be cycled through for all chapters)
# =============================================================================

AUDIO_URLS = [
    "shrota-audio-library/test-book-9b638a06-097e-4512-b62e-800624d0dcd6/long-2-hrs-chapter-58294b08-4df9-4259-ba8b-be56e03184d0/playlist.m3u8",
    "shrota-audio-library/test-book-9b638a06-097e-4512-b62e-800624d0dcd6/sdfwerwerwe-e7ace2d8-070e-49d6-a6dc-9474eff2bb02/playlist.m3u8",
    "shrota-audio-library/test-book-9b638a06-097e-4512-b62e-800624d0dcd6/sdksjhdfjksf-9a8ddb52-a547-4d1d-b6d0-3790ecf1c2b2/playlist.m3u8",
    "shrota-audio-library/वयवहरक-शळपलन-goat-farming-audio-book-in-marathi-629d53f1-b7ee-42cb-94be-e6ed3e683d75/शळपलन-पसतक-परसतवन-3c122e04-e5b6-4f1b-9d05-43447e3d3de6/playlist.m3u8",
    "shrota-audio-library/वयवहरक-शळपलन-goat-farming-audio-book-in-marathi-629d53f1-b7ee-42cb-94be-e6ed3e683d75/topic-2-2d29d77a-c444-4240-af4f-a28c51c893f3/playlist.m3u8",
]

# =============================================================================
# SEED DATA DEFINITIONS
# =============================================================================

LANGUAGES = [
    {"name": "Hindi", "code": "hi"},
    {"name": "Marathi", "code": "mr"},
    {"name": "English", "code": "en"},
]

GENRES = [
    {"name": "Fiction", "description": "Imaginative stories and novels that explore human experiences through narrative"},
    {"name": "Non-Fiction", "description": "Factual and informative books covering real events, biographies, and educational content"},
    {"name": "Mystery/Thriller", "description": "Suspenseful stories featuring crime, detective work, and page-turning tension"},
    {"name": "Biography", "description": "Life stories and memoirs of notable personalities and historical figures"},
    {"name": "Self-Help", "description": "Personal development, motivation, and practical guides for better living"},
]

AUTHORS = [
    {
        "name": "Munshi Premchand",
        "bio": "Munshi Premchand (1880-1936) was one of the greatest Hindi-Urdu writers. Known as 'Upanyas Samrat' (Emperor of Novels), he wrote over 300 short stories and several novels including Godaan, Gaban, and Nirmala."
    },
    {
        "name": "R.K. Narayan",
        "bio": "Rasipuram Krishnaswami Iyer Narayanaswami (1906-2001) was an Indian writer known for his works set in the fictional South Indian town of Malgudi. His notable works include Swami and Friends, The Guide, and Malgudi Days."
    },
    {
        "name": "Amish Tripathi",
        "bio": "Amish Tripathi is a contemporary Indian author known for the Shiva Trilogy and Ram Chandra Series. His mythology-based fiction has sold millions of copies, making him one of India's best-selling authors."
    },
    {
        "name": "Chetan Bhagat",
        "bio": "Chetan Bhagat is a bestselling Indian author and screenwriter. His novels including Five Point Someone, 2 States, and Half Girlfriend have been adapted into successful Bollywood films."
    },
    {
        "name": "Devdutt Pattanaik",
        "bio": "Devdutt Pattanaik is an Indian mythologist, author, and illustrator known for his work on Hindu mythology. He has written over 50 books including Jaya, Sita, and My Gita."
    },
    {
        "name": "Rabindranath Tagore",
        "bio": "Rabindranath Tagore (1861-1941) was a Bengali polymath who reshaped Bengali literature and music. He became the first non-European to win the Nobel Prize in Literature in 1913 for Gitanjali."
    },
    {
        "name": "Ruskin Bond",
        "bio": "Ruskin Bond is a beloved Indian author of British descent who has been writing for over 60 years. Known for his children's books and stories set in the Himalayan foothills, including The Blue Umbrella and The Room on the Roof."
    },
    {
        "name": "Arundhati Roy",
        "bio": "Arundhati Roy is an Indian author and activist. Her debut novel The God of Small Things (1997) won the Booker Prize and became the biggest-selling book by a non-expatriate Indian author."
    },
    {
        "name": "Vikram Seth",
        "bio": "Vikram Seth is an Indian novelist and poet. His epic novel A Suitable Boy is one of the longest novels ever published in English. He has also written The Golden Gate and An Equal Music."
    },
    {
        "name": "Sudha Murty",
        "bio": "Sudha Murty is an Indian educator, author, and philanthropist. She has written numerous books in Kannada and English including Wise and Otherwise, The Magic Drum, and Dollar Bahu."
    },
]

ARTISTS = [
    {
        "name": "Harish Bhimani",
        "bio": "Harish Bhimani is a legendary voice artist known for narrating the iconic TV series Mahabharat. His deep, resonant voice brings gravitas to mythological and literary audiobooks."
    },
    {
        "name": "Neena Gupta",
        "bio": "Neena Gupta is an acclaimed actress whose expressive narration style captures the emotional depth of contemporary fiction and memoirs with authenticity."
    },
    {
        "name": "Naseeruddin Shah",
        "bio": "Naseeruddin Shah is a veteran actor whose theatrical background brings dramatic intensity and nuanced character voices to audiobook narrations."
    },
    {
        "name": "Gulzar",
        "bio": "Gulzar is a renowned poet and lyricist whose melodious voice and poetic sensibility make him the perfect narrator for literary fiction and poetry collections."
    },
    {
        "name": "Anupam Kher",
        "bio": "Anupam Kher is a versatile actor whose warm, engaging narration style is perfect for motivational content and heartfelt stories."
    },
    {
        "name": "Shabana Azmi",
        "bio": "Shabana Azmi is an acclaimed actress known for her powerful performances. Her narration brings depth and emotion to women-centric stories and literary fiction."
    },
    {
        "name": "Amitabh Bachchan",
        "bio": "Amitabh Bachchan's iconic baritone voice lends an epic quality to mythological tales and classic literature narrations."
    },
    {
        "name": "Konkona Sen Sharma",
        "bio": "Konkona Sen Sharma is a talented actress whose contemporary sensibility and clear diction make her ideal for modern fiction narrations."
    },
    {
        "name": "Irrfan Khan",
        "bio": "Irrfan Khan's thoughtful, measured narration style brings an intimate quality to philosophical and literary audiobooks."
    },
    {
        "name": "Tisca Chopra",
        "bio": "Tisca Chopra is an actress and author whose versatile voice captures both warmth and wit in her audiobook narrations."
    },
]

PUBLICATIONS = [
    {
        "name": "Penguin Random House India",
        "description": "One of India's leading publishing houses, known for publishing both classic and contemporary literature across multiple Indian languages."
    },
    {
        "name": "HarperCollins India",
        "description": "A major international publisher with a strong presence in India, publishing fiction, non-fiction, and children's books."
    },
    {
        "name": "Rupa Publications",
        "description": "One of India's oldest and largest publishing houses, known for publishing bestselling Indian authors and diverse content."
    },
    {
        "name": "Westland Publications",
        "description": "A leading Indian publishing company known for commercial fiction and non-fiction, now part of Amazon Publishing."
    },
    {
        "name": "Jaico Publishing House",
        "description": "A respected Indian publisher known for self-help, business, and spiritual books since 1946."
    },
    {
        "name": "Rajkamal Prakashan",
        "description": "India's premier Hindi language publishing house, known for publishing literary classics and contemporary Hindi literature."
    },
    {
        "name": "Vani Prakashan",
        "description": "A major Hindi publishing house known for quality literature, poetry, and academic works in Hindi."
    },
    {
        "name": "Mauj Prakashan",
        "description": "Maharashtra's leading Marathi language publisher, known for literature, educational books, and children's content."
    },
    {
        "name": "Sahitya Akademi",
        "description": "India's National Academy of Letters, publishing literature in all 22 scheduled languages of India."
    },
    {
        "name": "Hachette India",
        "description": "Part of the global Hachette Livre group, publishing award-winning fiction and non-fiction in India."
    },
]

# 50 Books with their metadata
BOOKS = [
    # Hindi Fiction (10 books)
    {
        "title": "Godaan",
        "information": "Munshi Premchand's magnum opus depicting the struggles of Indian peasant life. The story of Hori, a poor farmer, and his lifelong desire to own a cow symbolizes the exploitation and hardships of rural India.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 0,  # Premchand
        "chapters": ["प्रस्तावना", "होरी का संघर्ष", "गाँव की जिंदगी", "सामाजिक बंधन", "अंतिम यात्रा"]
    },
    {
        "title": "Gaban",
        "information": "A compelling novel about Ramanath's moral downfall after embezzling money to fulfill his wife Jalpa's desire for jewelry. A powerful commentary on middle-class aspirations and moral corruption.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 0,
        "chapters": ["जलपा की चाहत", "रमानाथ का पतन", "भागना", "पश्चाताप", "मुक्ति"]
    },
    {
        "title": "Nirmala",
        "information": "A heart-wrenching story of a young woman married to a much older widower. The novel explores the tragic consequences of dowry and age-inappropriate marriages in Indian society.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 0,
        "chapters": ["विवाह", "संघर्ष", "संदेह", "त्रासदी"]
    },
    {
        "title": "Rangbhoomi",
        "information": "An epic novel about Surdas, a blind beggar who fights against industrial capitalism. A powerful narrative about the conflict between traditional India and modernization.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 0,
        "chapters": ["सूरदास", "जमीन की लड़ाई", "औद्योगीकरण", "प्रतिरोध", "अंत"]
    },
    {
        "title": "Kafan",
        "information": "One of Premchand's most powerful short story collections, including the titular story about poverty's dehumanizing effect on a father and son who spend their wife's/mother's shroud money on food.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 0,
        "chapters": ["कफन", "ईदगाह", "पूस की रात", "बड़े घर की बेटी"]
    },
    {
        "title": "The Immortals of Meluha",
        "information": "The first book in the Shiva Trilogy reimagines Lord Shiva as a tribal chief who arrives in Meluha and discovers his destiny. A blend of mythology, philosophy, and adventure.",
        "language": "Hindi",
        "genres": ["Fiction", "Mystery/Thriller"],
        "author_index": 2,  # Amish
        "chapters": ["मेलुहा में आगमन", "नीलकंठ का उदय", "चंद्रवंशियों का रहस्य", "सती से मिलन", "नागाओं का आक्रमण", "युद्ध की तैयारी"]
    },
    {
        "title": "The Secret of the Nagas",
        "information": "The second book in the Shiva Trilogy continues the quest as Shiva searches for the true evil while uncovering the secrets of the Nagas. Epic battles and philosophical revelations await.",
        "language": "Hindi",
        "genres": ["Fiction", "Mystery/Thriller"],
        "author_index": 2,
        "chapters": ["खोज", "नागलोक", "काली का रहस्य", "गणेश", "ब्रंगा", "सत्य का खुलासा"]
    },
    {
        "title": "The Oath of the Vayuputras",
        "information": "The epic conclusion of the Shiva Trilogy. Shiva must make the ultimate sacrifice to destroy evil. A tale of duty, love, and the price of being a legend.",
        "language": "Hindi",
        "genres": ["Fiction", "Mystery/Thriller"],
        "author_index": 2,
        "chapters": ["वायुपुत्रों की शपथ", "सोमरस का रहस्य", "देवगिरी की लड़ाई", "अंतिम युद्ध", "महादेव"]
    },
    {
        "title": "Ram: Scion of Ikshvaku",
        "information": "The first book in the Ram Chandra Series presents Ram as a prince questioning dharma in a kingdom plagued by problems. A fresh retelling of the Ramayana.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 2,
        "chapters": ["इक्ष्वाकु वंश", "राम का जन्म", "गुरुकुल", "सीता स्वयंवर", "वनवास", "लंका की ओर"]
    },
    {
        "title": "Sita: Warrior of Mithila",
        "information": "The second book in the Ram Chandra Series tells the Ramayana from Sita's perspective. A warrior princess, she is raised to be the prime minister of Mithila.",
        "language": "Hindi",
        "genres": ["Fiction"],
        "author_index": 2,
        "chapters": ["मिथिला की योद्धा", "सीता की शिक्षा", "राम से मिलन", "अग्निपरीक्षा", "माता सीता"]
    },

    # English Fiction (10 books)
    {
        "title": "The Guide",
        "information": "R.K. Narayan's Sahitya Akademi Award-winning novel about Raju, a tourist guide who transforms from a convict to a spiritual guide. A masterpiece exploring identity and redemption.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 1,  # R.K. Narayan
        "chapters": ["The Railway Raju", "Rosie the Dancer", "The Temple", "The Drought", "The Fast"]
    },
    {
        "title": "Malgudi Days",
        "information": "A delightful collection of short stories set in the fictional town of Malgudi. From the astrologer to the vendor of sweets, these tales capture the essence of small-town India.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 1,
        "chapters": ["An Astrologer's Day", "The Missing Mail", "The Doctor's Word", "Gateman's Gift", "The Blind Dog", "Fellow-Feeling"]
    },
    {
        "title": "Swami and Friends",
        "information": "The first novel in the Malgudi series follows Swaminathan and his friends through the adventures of childhood in colonial India. A nostalgic journey into innocence.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 1,
        "chapters": ["Monday Morning", "Rajam and Mani", "Swami's Grandmother", "The Cricket Match", "Breaking Loose"]
    },
    {
        "title": "The God of Small Things",
        "information": "Arundhati Roy's Booker Prize-winning debut novel. Set in Kerala, it tells the story of twins Rahel and Estha, exploring how small things affect people's behavior and lives.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 7,  # Arundhati Roy
        "chapters": ["Paradise Pickles", "Pappachi's Moth", "Big Man the Laltain", "Abhilash Talkies", "The River", "The Cost of Living"]
    },
    {
        "title": "A Suitable Boy",
        "information": "Vikram Seth's epic novel set in post-independence India follows Mrs. Rupa Mehra's quest to find a suitable boy for her daughter Lata. A panoramic view of Indian society.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 8,  # Vikram Seth
        "chapters": ["Brahmpur", "The Wedding", "Calcutta", "The Election", "The Verdict", "A Suitable Boy"]
    },
    {
        "title": "Five Point Someone",
        "information": "Chetan Bhagat's debut novel about three friends at IIT Delhi who dare to challenge the system. A story of friendship, pressure, and following your dreams.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 3,  # Chetan Bhagat
        "chapters": ["IIT Dreams", "Five Point Someone", "The Disco", "The DC", "The Loot", "The Finale"]
    },
    {
        "title": "2 States",
        "information": "A semi-autobiographical novel about a Punjabi boy and a Tamil girl trying to convince their families to accept their marriage. A humorous take on cross-cultural relationships in India.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 3,
        "chapters": ["The Beginning", "Tamil Nadu", "Punjab", "The Challenges", "The Wedding"]
    },
    {
        "title": "Half Girlfriend",
        "information": "A story about Madhav from Bihar and Riya from Delhi, navigating class differences and a complicated relationship where she agrees to be his 'half girlfriend'.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 3,
        "chapters": ["St. Stephen's", "Basketball", "Half Girlfriend", "New York", "The Gates Foundation", "Full Circle"]
    },
    {
        "title": "The Room on the Roof",
        "information": "Ruskin Bond's semi-autobiographical novel about Rusty, a young Anglo-Indian boy in Dehradun. Winner of the John Llewellyn Rhys Prize, it captures the essence of coming of age.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 6,  # Ruskin Bond
        "chapters": ["The Guardian", "Somi and the Gang", "Meena", "The Escape", "The Room", "Freedom"]
    },
    {
        "title": "The Blue Umbrella",
        "information": "A heartwarming children's story about Binya and her beautiful blue umbrella that becomes the envy of her village. A tale about greed, innocence, and redemption.",
        "language": "English",
        "genres": ["Fiction"],
        "author_index": 6,
        "chapters": ["The Umbrella", "Ram Bharosa's Envy", "The Theft", "The Resolution"]
    },

    # Biography/Non-Fiction (10 books)
    {
        "title": "Wings of Fire",
        "information": "The autobiography of Dr. APJ Abdul Kalam, India's 'Missile Man' and former President. From humble beginnings in Rameswaram to leading India's space program, an inspiring life story.",
        "language": "English",
        "genres": ["Biography", "Non-Fiction"],
        "author_index": 9,  # Using Sudha Murty as placeholder narrator/co-author
        "chapters": ["Orientation", "Creation", "Propitiation", "Contemplation"]
    },
    {
        "title": "My Experiments with Truth",
        "information": "Mahatma Gandhi's autobiography covering his life from childhood through his early political career. A profound exploration of truth, non-violence, and self-discovery.",
        "language": "English",
        "genres": ["Biography", "Non-Fiction"],
        "author_index": 5,  # Using Tagore as placeholder
        "chapters": ["Childhood", "London", "South Africa", "The Struggle Begins", "Return to India", "Satyagraha"]
    },
    {
        "title": "Gitanjali",
        "information": "Rabindranath Tagore's Nobel Prize-winning collection of spiritual poems. 'Song Offerings' presents 103 English prose poems of profound beauty and mystical devotion.",
        "language": "English",
        "genres": ["Non-Fiction"],
        "author_index": 5,  # Tagore
        "chapters": ["Poems 1-20", "Poems 21-40", "Poems 41-60", "Poems 61-80", "Poems 81-103"]
    },
    {
        "title": "Wise and Otherwise",
        "information": "Sudha Murty's collection of 51 true short stories from her experiences across India. Heartwarming and thought-provoking tales of human nature.",
        "language": "English",
        "genres": ["Non-Fiction", "Biography"],
        "author_index": 9,  # Sudha Murty
        "chapters": ["The Interview", "Mother's Love", "A Simple Act", "Appearances", "True Wealth", "Life Lessons"]
    },
    {
        "title": "Three Thousand Stitches",
        "information": "Sudha Murty's collection of true stories about remarkable women and their extraordinary courage. Tales of resilience from ordinary people.",
        "language": "English",
        "genres": ["Non-Fiction", "Biography"],
        "author_index": 9,
        "chapters": ["Stitches", "The Difference", "Red Rice", "The Gift", "Eyes"]
    },
    {
        "title": "My Gita",
        "information": "Devdutt Pattanaik's personal interpretation of the Bhagavad Gita. A fresh perspective on the timeless wisdom of the Gita for modern readers.",
        "language": "English",
        "genres": ["Non-Fiction", "Self-Help"],
        "author_index": 4,  # Devdutt
        "chapters": ["Arjuna's Dilemma", "Karma Yoga", "Bhakti Yoga", "Gyana Yoga", "The Cosmic Form"]
    },
    {
        "title": "Jaya: An Illustrated Retelling of the Mahabharata",
        "information": "Devdutt Pattanaik's comprehensive retelling of the Mahabharata with over 250 illustrations. An accessible guide to India's greatest epic.",
        "language": "English",
        "genres": ["Non-Fiction"],
        "author_index": 4,
        "chapters": ["Origins", "The Dice Game", "The Exile", "The War", "The Aftermath", "Wisdom"]
    },
    {
        "title": "Sita: An Illustrated Retelling of the Ramayana",
        "information": "The Ramayana retold from Sita's perspective by Devdutt Pattanaik. A fresh take on the epic that centers the story's most important woman.",
        "language": "English",
        "genres": ["Non-Fiction"],
        "author_index": 4,
        "chapters": ["Janaki", "Ram's Bride", "The Forest", "Lanka", "The Return", "The Final Journey"]
    },
    {
        "title": "India's Greatest Minds",
        "information": "A collection of biographies of India's most influential thinkers, scientists, and leaders who shaped the nation's destiny.",
        "language": "English",
        "genres": ["Biography", "Non-Fiction"],
        "author_index": 9,
        "chapters": ["Swami Vivekananda", "Rabindranath Tagore", "CV Raman", "Homi Bhabha", "Vikram Sarabhai"]
    },
    {
        "title": "Playing It My Way",
        "information": "Sachin Tendulkar's autobiography chronicling his incredible cricket journey. From a young prodigy to becoming the God of Cricket, an inspiring sports biography.",
        "language": "English",
        "genres": ["Biography", "Non-Fiction"],
        "author_index": 3,  # Placeholder
        "chapters": ["Childhood Dreams", "Test Debut", "World Cup 1996", "The Captaincy", "200th Test", "Farewell"]
    },

    # Self-Help (5 books)
    {
        "title": "You Can Win",
        "information": "Shiv Khera's bestselling self-help book that provides a step-by-step guide to success. Covers attitude, motivation, and building winning habits.",
        "language": "English",
        "genres": ["Self-Help", "Non-Fiction"],
        "author_index": 3,  # Placeholder
        "chapters": ["Importance of Attitude", "Success", "Motivation", "Self-Esteem", "Interpersonal Skills", "Values and Vision"]
    },
    {
        "title": "The Monk Who Sold His Ferrari",
        "information": "Robin Sharma's fable about Julian Mantle, a lawyer who transforms his life after a heart attack. A guide to living with courage, balance, and joy.",
        "language": "English",
        "genres": ["Self-Help", "Non-Fiction"],
        "author_index": 3,
        "chapters": ["The Wake-Up Call", "The Mysterious Visitor", "The Miraculous Transformation", "The Sages of Sivana", "The Seven Virtues"]
    },
    {
        "title": "Ikigai: The Japanese Secret",
        "information": "Discover the Japanese concept of 'reason for being'. Learn how to find your purpose and live a long, fulfilling life through ikigai.",
        "language": "English",
        "genres": ["Self-Help", "Non-Fiction"],
        "author_index": 9,
        "chapters": ["What is Ikigai", "Finding Your Ikigai", "The Okinawa Way", "Flow State", "Resilience", "Living Your Ikigai"]
    },
    {
        "title": "The Power of Your Subconscious Mind",
        "information": "Joseph Murphy's classic guide to harnessing the power of your subconscious mind. Practical techniques for achieving your goals.",
        "language": "English",
        "genres": ["Self-Help", "Non-Fiction"],
        "author_index": 9,
        "chapters": ["The Treasure House", "How Your Mind Works", "The Miracle Power", "Mental Healings", "Practical Techniques"]
    },
    {
        "title": "Chanakya Neeti",
        "information": "The timeless wisdom of Chanakya, ancient India's greatest strategist. Practical advice on politics, relationships, and success.",
        "language": "Hindi",
        "genres": ["Self-Help", "Non-Fiction"],
        "author_index": 4,
        "chapters": ["शिक्षा का महत्व", "धन और समृद्धि", "राजनीति", "परिवार और मित्रता", "जीवन का सार"]
    },

    # Marathi Literature (10 books)
    {
        "title": "Shyamchi Aai",
        "information": "Sane Guruji's beloved autobiography about his mother, a classic of Marathi literature. A touching portrayal of maternal love and values.",
        "language": "Marathi",
        "genres": ["Biography", "Fiction"],
        "author_index": 9,  # Placeholder
        "chapters": ["बालपण", "आईची शिकवण", "संस्कार", "त्याग", "अंतिम दिवस"]
    },
    {
        "title": "Yayati",
        "information": "V.S. Khandekar's Jnanpith Award-winning novel based on the mythological king Yayati. An exploration of desire, morality, and the human condition.",
        "language": "Marathi",
        "genres": ["Fiction"],
        "author_index": 9,
        "chapters": ["यौवन", "देवयानी", "शर्मिष्ठा", "पुत्रों का शाप", "मुक्ति"]
    },
    {
        "title": "Mrityunjay",
        "information": "Shivaji Sawant's epic novel on Karna from the Mahabharata. A powerful retelling from the perspective of the tragic hero, winner of the Moortidevi Award.",
        "language": "Marathi",
        "genres": ["Fiction"],
        "author_index": 9,
        "chapters": ["जन्म", "द्रोणाचार्य", "द्रौपदी", "कुरुक्षेत्र", "अंतिम युद्ध", "मृत्युंजय"]
    },
    {
        "title": "Chhava",
        "information": "Shivaji Sawant's historical novel about Sambhaji Maharaj, son of Chhatrapati Shivaji. A tale of courage, sacrifice, and unwavering commitment to Swarajya.",
        "language": "Marathi",
        "genres": ["Fiction", "Biography"],
        "author_index": 9,
        "chapters": ["राजकुमार", "युवराज", "छत्रपति", "औरंगजेबाशी संघर्ष", "बलिदान"]
    },
    {
        "title": "Panipat",
        "information": "Vishwas Patil's epic novel about the Third Battle of Panipat. A gripping account of the Maratha Empire's fateful encounter with Ahmad Shah Abdali.",
        "language": "Marathi",
        "genres": ["Fiction"],
        "author_index": 9,
        "chapters": ["दिल्लीची वाटचाल", "पानिपतच्या मैदानावर", "युद्धाची तयारी", "महायुद्ध", "पराभव आणि शौर्य"]
    },
    {
        "title": "Swami",
        "information": "Ranjit Desai's historical novel about Chhatrapati Shivaji Maharaj. An inspiring portrayal of the founder of the Maratha Empire and his vision of Swarajya.",
        "language": "Marathi",
        "genres": ["Fiction", "Biography"],
        "author_index": 9,
        "chapters": ["बालपण", "स्वराज्याची स्थापना", "आग्र्याहून सुटका", "राज्याभिषेक", "दक्षिण दिग्विजय"]
    },
    {
        "title": "Shriman Yogi",
        "information": "Another masterpiece by Ranjit Desai about Shivaji Maharaj, focusing on his spiritual journey alongside his political achievements.",
        "language": "Marathi",
        "genres": ["Fiction", "Biography"],
        "author_index": 9,
        "chapters": ["जिजाऊ माता", "शपथ", "तोरणा", "स्वराज्य", "हिंदवी स्वराज्य"]
    },
    {
        "title": "Zunj",
        "information": "A gripping Marathi novel about the struggles of common people against oppression. A tale of resistance and the human spirit.",
        "language": "Marathi",
        "genres": ["Fiction"],
        "author_index": 9,
        "chapters": ["सुरुवात", "संघर्ष", "एकता", "विजय"]
    },
    {
        "title": "Duniyadari",
        "information": "Suhas Shirvalkar's popular novel about college life, friendship, and love in Pune. A nostalgic journey through youth and relationships.",
        "language": "Marathi",
        "genres": ["Fiction"],
        "author_index": 9,
        "chapters": ["कॉलेज", "मैत्री", "प्रेम", "विरह", "पुनर्मिलन"]
    },
    {
        "title": "Kosala",
        "information": "Bhalchandra Nemade's landmark novel that revolutionized Marathi literature. A raw, authentic portrayal of rural Maharashtra life.",
        "language": "Marathi",
        "genres": ["Fiction"],
        "author_index": 9,
        "chapters": ["गाव", "शहर", "संघर्ष", "आत्मशोध"]
    },

    # Mystery/Thriller (5 books)
    {
        "title": "The Krishna Key",
        "information": "Ashwin Sanghi's thriller connecting Krishna mythology with a modern-day murder mystery. A fast-paced adventure across India's ancient sites.",
        "language": "English",
        "genres": ["Mystery/Thriller", "Fiction"],
        "author_index": 2,  # Using Amish as placeholder
        "chapters": ["The Murder", "The Seals", "Dwarka", "The Chase", "The Secret", "The Truth"]
    },
    {
        "title": "The Rozabal Line",
        "information": "Ashwin Sanghi's debut thriller exploring the theory that Jesus survived crucifixion and traveled to India. A controversial page-turner.",
        "language": "English",
        "genres": ["Mystery/Thriller", "Fiction"],
        "author_index": 2,
        "chapters": ["The Beginning", "The Vatican", "Kashmir", "The Illuminati", "Rozabal", "Revelation"]
    },
    {
        "title": "Chanakya's Chant",
        "information": "A parallel narrative following Chanakya in ancient India and a modern political strategist. A tale of power, strategy, and manipulation.",
        "language": "English",
        "genres": ["Mystery/Thriller", "Fiction"],
        "author_index": 2,
        "chapters": ["Takshashila", "Modern India", "The Game", "The Coup", "Victory"]
    },
    {
        "title": "Sacred Games",
        "information": "Vikram Chandra's epic crime novel set in Mumbai. A police inspector and a crime lord's intertwined fates reveal the dark underbelly of the city.",
        "language": "English",
        "genres": ["Mystery/Thriller", "Fiction"],
        "author_index": 8,
        "chapters": ["Ganesh Gaitonde", "Sartaj Singh", "The Game Begins", "Mumbai Noir", "Apocalypse", "The End"]
    },
    {
        "title": "Byomkesh Bakshi Stories",
        "information": "Collection of detective stories featuring Bengal's beloved sleuth Byomkesh Bakshi. Classic Indian crime fiction at its finest.",
        "language": "English",
        "genres": ["Mystery/Thriller", "Fiction"],
        "author_index": 1,
        "chapters": ["Satyanweshi", "The Gramophone Pin", "Where There's a Will", "The Venom", "Picture Imperfect"]
    },
]


async def clear_existing_data(session):
    """Clear existing data in reverse order of dependencies."""
    from sqlalchemy import text

    print("Clearing existing data...")

    # Disable foreign key checks temporarily and truncate tables
    await session.execute(text("TRUNCATE TABLE chapters CASCADE"))
    await session.execute(text("TRUNCATE TABLE book_authors CASCADE"))
    await session.execute(text("TRUNCATE TABLE book_artists CASCADE"))
    await session.execute(text("TRUNCATE TABLE book_genres CASCADE"))
    await session.execute(text("TRUNCATE TABLE books CASCADE"))
    await session.execute(text("TRUNCATE TABLE authors CASCADE"))
    await session.execute(text("TRUNCATE TABLE artists CASCADE"))
    await session.execute(text("TRUNCATE TABLE genres CASCADE"))
    await session.execute(text("TRUNCATE TABLE languages CASCADE"))
    await session.execute(text("TRUNCATE TABLE publications CASCADE"))

    await session.commit()
    print("Existing data cleared.")


async def seed():
    """Main seed function."""
    print("=" * 60)
    print("Starting database seed...")
    print("=" * 60)

    async with async_session() as session:
        # Clear existing data
        await clear_existing_data(session)

        # 1. Create Languages
        print("\n[1/6] Creating languages...")
        languages = {}
        for lang_data in LANGUAGES:
            lang = Language(**lang_data)
            session.add(lang)
            languages[lang_data["name"]] = lang
        await session.flush()
        print(f"  Created {len(LANGUAGES)} languages")

        # 2. Create Genres
        print("\n[2/6] Creating genres...")
        genres = {}
        for genre_data in GENRES:
            genre = Genre(**genre_data)
            session.add(genre)
            genres[genre_data["name"]] = genre
        await session.flush()
        print(f"  Created {len(GENRES)} genres")

        # 3. Create Authors
        print("\n[3/6] Creating authors...")
        authors = []
        for author_data in AUTHORS:
            author = Author(**author_data)
            session.add(author)
            authors.append(author)
        await session.flush()
        print(f"  Created {len(AUTHORS)} authors")

        # 4. Create Artists
        print("\n[4/6] Creating artists...")
        artists = []
        for artist_data in ARTISTS:
            artist = Artist(**artist_data)
            session.add(artist)
            artists.append(artist)
        await session.flush()
        print(f"  Created {len(ARTISTS)} artists")

        # 5. Create Publications
        print("\n[5/6] Creating publications...")
        publications = []
        for pub_data in PUBLICATIONS:
            pub = Publication(**pub_data)
            session.add(pub)
            publications.append(pub)
        await session.flush()
        print(f"  Created {len(PUBLICATIONS)} publications")

        # 6. Create Books with Chapters
        print("\n[6/6] Creating books with chapters...")
        book_count = 0
        chapter_count = 0
        audio_index = 0  # Track which audio file to use

        for book_data in BOOKS:
            # Create book
            book = Book(
                title=book_data["title"],
                information=book_data["information"],
                is_published=True,
                is_adult=False,
                language=languages[book_data["language"]],
                publisher=random.choice(publications),
            )

            # Add primary author
            primary_author = authors[book_data["author_index"]]
            book.authors.append(primary_author)

            # Randomly add a second author (20% chance)
            if random.random() < 0.2:
                second_author = random.choice([a for a in authors if a != primary_author])
                book.authors.append(second_author)

            # Add 1-2 random artists
            num_artists = random.randint(1, 2)
            selected_artists = random.sample(artists, num_artists)
            for artist in selected_artists:
                book.artists.append(artist)

            # Add genres
            for genre_name in book_data["genres"]:
                book.genres.append(genres[genre_name])

            session.add(book)
            await session.flush()

            # Create chapters with audio URLs (cycling through available audio files)
            book_total_duration = 0
            for order, chapter_title in enumerate(book_data["chapters"], start=1):
                # Get audio URL by cycling through available files
                audio_url = AUDIO_URLS[audio_index % len(AUDIO_URLS)]
                audio_index += 1

                chapter_duration = random.randint(600, 3600)  # 10-60 minutes
                book_total_duration += chapter_duration

                chapter = Chapter(
                    book_id=book.id,
                    title=chapter_title,
                    order=order,
                    is_published=True,
                    file_id=f"seed-audio-{audio_index}.m4a",  # Placeholder file_id
                    audio_url=audio_url,
                    duration=chapter_duration,
                    file_size=random.randint(5000000, 50000000),  # 5-50 MB
                )
                session.add(chapter)
                chapter_count += 1

            # Update book's total duration
            book.total_duration = book_total_duration

            book_count += 1
            if book_count % 10 == 0:
                print(f"  Created {book_count} books...")

        await session.commit()
        print(f"  Created {book_count} books with {chapter_count} chapters")

        print("\n" + "=" * 60)
        print("Seed completed successfully!")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - Languages: {len(LANGUAGES)}")
        print(f"  - Genres: {len(GENRES)}")
        print(f"  - Authors: {len(AUTHORS)}")
        print(f"  - Artists: {len(ARTISTS)}")
        print(f"  - Publications: {len(PUBLICATIONS)}")
        print(f"  - Books: {book_count}")
        print(f"  - Chapters: {chapter_count}")


if __name__ == "__main__":
    asyncio.run(seed())
