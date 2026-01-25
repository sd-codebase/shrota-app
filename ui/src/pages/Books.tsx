import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Upload,
  InputNumber,
  Switch,
  Tag,
  Tooltip,
  Progress,
  Result,
  Drawer,
  Descriptions,
  Divider,
  Popover,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SoundOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Book, BookCreate, Genre, Author, Publication, Chapter, ChapterCreate, Artist, Language } from '../types';
import MiniPlayer from '../components/MiniPlayer';
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getGenres,
  getAuthors,
  getPublications,
  getArtists,
  getLanguages,
  addChapter,
  updateChapter,
  deleteChapter,
  processChapter,
  uploadChapterFile,
  getChapterFileUrl,
  uploadThumbnail,
  getThumbnailUrl,
  uploadChapterImage,
  getChapterImageUrl,
} from '../api';

function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);
  const [chapterImageFileList, setChapterImageFileList] = useState<UploadFile[]>([]);
  const [processingChapters, setProcessingChapters] = useState<Set<string>>(new Set());
  const [processingProgress, setProcessingProgress] = useState<{ [key: string]: number }>({});
  const [processingModalVisible, setProcessingModalVisible] = useState(false);
  const [processingChapterName, setProcessingChapterName] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<{ audioUrl: string; title: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bookForm] = Form.useForm();
  const [chapterForm] = Form.useForm();

  const fetchBooks = async (search?: string) => {
    setLoading(true);
    try {
      const data = await getBooks(search);
      setBooks(data);
      // Update viewing book if drawer is open
      if (viewingBook) {
        const updated = data.find(b => b.id === viewingBook.id);
        if (updated) setViewingBook(updated);
      }
    } catch (error) {
      message.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const data = await getGenres();
      setGenres(data);
    } catch (error) {
      message.error('Failed to fetch genres');
    }
  };

  const fetchAuthors = async () => {
    try {
      const data = await getAuthors();
      setAuthors(data);
    } catch (error) {
      message.error('Failed to fetch authors');
    }
  };

  const fetchPublications = async () => {
    try {
      const data = await getPublications();
      setPublications(data);
    } catch (error) {
      message.error('Failed to fetch publications');
    }
  };

  const fetchArtists = async () => {
    try {
      const data = await getArtists();
      setArtists(data);
    } catch (error) {
      message.error('Failed to fetch artists');
    }
  };

  const fetchLanguages = async () => {
    try {
      const data = await getLanguages();
      setLanguages(data);
    } catch (error) {
      message.error('Failed to fetch languages');
    }
  };

  useEffect(() => {
    fetchGenres();
    fetchAuthors();
    fetchPublications();
    fetchArtists();
    fetchLanguages();
  }, []);

  // Debounce search and fetch from API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch books when debounced search changes
  useEffect(() => {
    fetchBooks(debouncedSearch || undefined);
  }, [debouncedSearch]);

  const handleAddBook = () => {
    setEditingBook(null);
    bookForm.resetFields();
    setThumbnailFileList([]);
    setBookModalOpen(true);
  };

  const handleEditBook = (record: Book) => {
    setEditingBook(record);
    bookForm.setFieldsValue(record);
    setThumbnailFileList(
      record.thumbnail
        ? [{ uid: record.thumbnail, name: record.thumbnail, status: 'done', url: getThumbnailUrl(record.thumbnail) }]
        : []
    );
    setBookModalOpen(true);
  };

  const handleViewBook = (record: Book) => {
    setViewingBook(record);
    setDrawerOpen(true);
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBook(id);
      message.success('Book deleted');
      if (viewingBook?.id === id) {
        setDrawerOpen(false);
        setViewingBook(null);
      }
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      message.error('Failed to delete book');
    }
  };

  const handleBookSubmit = async (values: BookCreate) => {
    try {
      let thumbnailFilename = editingBook?.thumbnail;

      if (thumbnailFileList.length > 0 && thumbnailFileList[0].originFileObj) {
        const thumbnailResponse = await uploadThumbnail(
          thumbnailFileList[0].originFileObj,
          values.title
        );
        thumbnailFilename = thumbnailResponse.filename;
      } else if (thumbnailFileList.length === 0) {
        thumbnailFilename = undefined;
      }

      const bookData: BookCreate = {
        ...values,
        thumbnail: thumbnailFilename,
      };

      if (editingBook) {
        await updateBook(editingBook.id, bookData);
        message.success('Book updated');
      } else {
        await createBook(bookData);
        message.success('Book created');
      }
      setBookModalOpen(false);
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      message.error('Failed to save book');
    }
  };

  const handleAddChapter = (book: Book) => {
    setSelectedBook(book);
    setEditingChapter(null);
    chapterForm.resetFields();
    chapterForm.setFieldsValue({ order: book.chapters.length });
    setFileList([]);
    setChapterImageFileList([]);
    setUploadedFileId(null);
    setUploadProgress(null);
    setIsUploading(false);
    setChapterModalOpen(true);
  };

  const handleEditChapter = (book: Book, chapter: Chapter) => {
    setSelectedBook(book);
    setEditingChapter(chapter);
    chapterForm.setFieldsValue(chapter);
    setFileList(
      chapter.file_id
        ? [{ uid: chapter.file_id, name: 'Audio file', status: 'done' }]
        : []
    );
    setChapterImageFileList(
      chapter.image
        ? [{ uid: chapter.image, name: chapter.image, status: 'done', url: getChapterImageUrl(chapter.image) }]
        : []
    );
    setUploadedFileId(chapter.file_id || null);
    setUploadProgress(null);
    setIsUploading(false);
    setChapterModalOpen(true);
  };

  const handleDeleteChapter = async (book: Book, chapterId: string) => {
    try {
      await deleteChapter(book.id, chapterId);
      message.success('Chapter deleted');
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      message.error('Failed to delete chapter');
    }
  };

  const handleProcessChapter = async (book: Book, chapter: Chapter) => {
    const chapterKey = `${book.id}-${chapter.id}`;
    setProcessingChapters((prev) => new Set(prev).add(chapterKey));
    setProcessingChapterName(`${book.title} - ${chapter.title}`);
    setProcessingProgress((prev) => ({ ...prev, [chapterKey]: 0 }));
    setProcessingComplete(false);
    setProcessingModalVisible(true);

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        const current = prev[chapterKey] || 0;
        if (current < 90) {
          return { ...prev, [chapterKey]: current + Math.random() * 15 };
        }
        return prev;
      });
    }, 500);

    try {
      await processChapter(book.id, chapter.id);
      clearInterval(progressInterval);
      setProcessingProgress((prev) => ({ ...prev, [chapterKey]: 100 }));
      setProcessingComplete(true);
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      clearInterval(progressInterval);
      setProcessingModalVisible(false);
      message.error('Failed to process chapter');
    } finally {
      setProcessingChapters((prev) => {
        const next = new Set(prev);
        next.delete(chapterKey);
        return next;
      });
    }
  };

  const handleProcessingModalClose = () => {
    setProcessingModalVisible(false);
    setProcessingComplete(false);
  };

  const handleStartAudioUpload = async () => {
    if (!selectedBook || fileList.length === 0 || !fileList[0].originFileObj) return;

    const order = chapterForm.getFieldValue('order') ?? 0;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadResponse = await uploadChapterFile(
        fileList[0].originFileObj,
        selectedBook.title,
        order,
        (percent) => setUploadProgress(percent)
      );
      setUploadedFileId(uploadResponse.file_id);
      setUploadProgress(100);
      message.success('Audio file uploaded successfully');
      // Update fileList to show as uploaded (remove originFileObj marker)
      setFileList([{ uid: uploadResponse.file_id, name: fileList[0].name || 'Audio file', status: 'done' }]);
    } catch (error) {
      message.error('Failed to upload audio file');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleChapterSubmit = async (values: ChapterCreate) => {
    if (!selectedBook) return;

    try {
      // Use the already-uploaded file_id, or keep existing one, or set undefined if cleared
      let fileId: string | undefined;
      if (uploadedFileId) {
        fileId = uploadedFileId;
      } else if (fileList.length > 0 && fileList[0].uid && !fileList[0].originFileObj) {
        // File was already uploaded before (editing existing chapter)
        fileId = editingChapter?.file_id;
      } else {
        fileId = undefined;
      }

      let imageFilename = editingChapter?.image;

      // Handle chapter image upload
      if (chapterImageFileList.length > 0 && chapterImageFileList[0].originFileObj) {
        const imageResponse = await uploadChapterImage(
          chapterImageFileList[0].originFileObj,
          selectedBook.title,
          values.order
        );
        imageFilename = imageResponse.filename;
      } else if (chapterImageFileList.length === 0) {
        imageFilename = undefined;
      }

      const chapterData: ChapterCreate = {
        ...values,
        file_id: fileId,
        image: imageFilename,
      };

      if (editingChapter) {
        await updateChapter(selectedBook.id, editingChapter.id, chapterData);
        message.success('Chapter updated');
      } else {
        await addChapter(selectedBook.id, chapterData);
        message.success('Chapter added');
      }
      setChapterModalOpen(false);
      setUploadedFileId(null);
      setUploadProgress(null);
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      message.error('Failed to save chapter');
    }
  };

  const getGenreNames = (genreIds: string[]) => {
    if (!genreIds || genreIds.length === 0) return '-';
    return genreIds
      .map(id => genres.find((g) => g.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  };

  const getAuthorNames = (authorIds: string[]) => {
    if (!authorIds || authorIds.length === 0) return '-';
    return authorIds
      .map(id => authors.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  };

  const getArtistNames = (artistIds: string[]) => {
    if (!artistIds || artistIds.length === 0) return '-';
    return artistIds
      .map(id => artists.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  };

  const getLanguageName = (languageId?: string) => {
    if (!languageId) return '-';
    const language = languages.find((l) => l.id === languageId);
    return language?.name || '-';
  };

  const getPublicationName = (publicationId?: string) => {
    if (!publicationId) return '-';
    const publication = publications.find((p) => p.id === publicationId);
    return publication?.name || '-';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleToggleBookPublish = async (book: Book) => {
    try {
      await updateBook(book.id, { is_published: !book.is_published });
      message.success(book.is_published ? 'Book unpublished' : 'Book published');
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      message.error('Failed to update publish status');
    }
  };

  const handleToggleChapterPublish = async (book: Book, chapter: Chapter) => {
    try {
      await updateChapter(book.id, chapter.id, { is_published: !chapter.is_published } as any);
      message.success(chapter.is_published ? 'Chapter unpublished' : 'Chapter published');
      fetchBooks(debouncedSearch || undefined);
    } catch (error) {
      message.error('Failed to update chapter publish status');
    }
  };

  // Style for truncated text (single line)
  const truncateStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // Style for truncated text (2 lines max)
  const truncate2LinesStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.4',
    maxHeight: '2.8em',
  };

  // Simplified columns for main table
  const columns = [
    {
      title: '',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 50,
      render: (thumbnail: string) =>
        thumbnail ? (
          <Popover
            content={
              <img
                src={getThumbnailUrl(thumbnail)}
                alt="thumbnail"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getThumbnailUrl(thumbnail)}
              alt="thumbnail"
              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            />
          </Popover>
        ) : (
          <div style={{ width: 32, height: 32, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PictureOutlined style={{ color: '#ccc', fontSize: 14 }} />
          </div>
        ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (_: string, record: Book) => (
        <Tooltip title={record.title} placement="topLeft">
          <div>
            <div style={truncateStyle}>{record.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.chapters.filter(ch => ch.is_published).length} / {record.chapters.length} chapters
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Authors',
      dataIndex: 'author_ids',
      key: 'author_ids',
      width: 200,
      render: (authorIds: string[]) => {
        const names = getAuthorNames(authorIds);
        return (
          <Tooltip title={names} placement="topLeft">
            <div style={truncate2LinesStyle}>{names}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Narrators',
      dataIndex: 'artist_ids',
      key: 'artist_ids',
      width: 200,
      render: (artistIds: string[]) => {
        const names = getArtistNames(artistIds);
        return (
          <Tooltip title={names} placement="topLeft">
            <div style={truncate2LinesStyle}>{names}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_published',
      key: 'is_published',
      width: 90,
      render: (isPublished: boolean) => (
        isPublished ? (
          <Tag color="green">Published</Tag>
        ) : (
          <Tag color="orange">Draft</Tag>
        )
      ),
    },
    {
      title: 'Adult',
      dataIndex: 'is_adult',
      key: 'is_adult',
      width: 70,
      render: (isAdult: boolean) => (
        isAdult ? <Tag color="red">18+</Tag> : null
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'right' as const,
      render: (_: unknown, record: Book) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => handleViewBook(record)}
          size="small"
        />
      ),
    },
  ];

  // Render chapters in drawer
  const renderChapters = (book: Book) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0 }}>Chapters ({book.chapters.length})</h4>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAddChapter(book)}
        >
          Add Chapter
        </Button>
      </div>
      {book.chapters.length === 0 ? (
        <p style={{ color: '#999' }}>No chapters yet</p>
      ) : (
        book.chapters
          .sort((a, b) => a.order - b.order)
          .map((chapter) => (
            <div
              key={chapter.id}
              style={{
                padding: '12px 16px',
                marginBottom: 8,
                background: '#fafafa',
                borderRadius: 8,
                border: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Chapter image thumbnail */}
                <div style={{ marginRight: 12 }}>
                  {chapter.image ? (
                    <Popover
                      content={
                        <img
                          src={getChapterImageUrl(chapter.image)}
                          alt={chapter.title}
                          style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
                        />
                      }
                      placement="right"
                      trigger="hover"
                    >
                      <img
                        src={getChapterImageUrl(chapter.image)}
                        alt={chapter.title}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                      />
                    </Popover>
                  ) : (
                    <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PictureOutlined style={{ color: '#ccc', fontSize: 16 }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: '#1890ff',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {chapter.order + 1}
                    </span>
                    <span style={{ fontWeight: 500 }}>{chapter.title}</span>
                    {chapter.is_published ? (
                      <Tag color="green" style={{ marginLeft: 4 }}>Published</Tag>
                    ) : (
                      <Tag color="orange" style={{ marginLeft: 4 }}>Draft</Tag>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginLeft: 32 }}>
                    {chapter.duration && <span style={{ marginRight: 12 }}>{formatDuration(chapter.duration)}</span>}
                    {chapter.file_id ? (
                      <a
                        href={getChapterFileUrl(chapter.file_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1890ff' }}
                      >
                        <SoundOutlined /> Audio uploaded
                      </a>
                    ) : (
                      <span style={{ color: '#999' }}>No audio</span>
                    )}
                    {chapter.audio_url && (
                      <Tag color="green" style={{ marginLeft: 8 }}>Processed</Tag>
                    )}
                  </div>
                </div>
                <Space size={4}>
                  <Tooltip title={!chapter.audio_url ? "Process chapter first to publish" : ""}>
                    <Switch
                      checked={chapter.is_published}
                      onChange={() => handleToggleChapterPublish(book, chapter)}
                      size="small"
                      disabled={!chapter.audio_url}
                    />
                  </Tooltip>
                  {chapter.audio_url ? (
                    <Button
                      icon={<PlayCircleOutlined />}
                      size="small"
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                      onClick={() => setCurrentlyPlaying({
                        audioUrl: chapter.audio_url!,
                        title: `${book.title} - ${chapter.title}`
                      })}
                    />
                  ) : (
                    <Button
                      icon={
                        processingChapters.has(`${book.id}-${chapter.id}`) ? (
                          <LoadingOutlined />
                        ) : (
                          <ThunderboltOutlined />
                        )
                      }
                      size="small"
                      onClick={() => handleProcessChapter(book, chapter)}
                      disabled={!chapter.file_id || processingChapters.has(`${book.id}-${chapter.id}`)}
                      title="Process to HLS"
                    />
                  )}
                  <Button
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => handleEditChapter(book, chapter)}
                  />
                  <Tooltip title={chapter.is_published ? "Unpublish chapter before deleting" : ""}>
                    <Popconfirm
                      title="Delete this chapter?"
                      onConfirm={() => handleDeleteChapter(book, chapter.id)}
                      disabled={chapter.is_published}
                    >
                      <Button icon={<DeleteOutlined />} danger size="small" disabled={chapter.is_published} />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              </div>
            </div>
          ))
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Books</h1>
        <Space>
          <Input
            placeholder="Search by title"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBook}>
            Add Book
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={books}
        rowKey="id"
        loading={loading}
        size="small"
      />

      {/* Book Details Drawer */}
      <Drawer
        title={viewingBook?.title || 'Book Details'}
        placement="right"
        width={600}
        onClose={() => {
          setDrawerOpen(false);
          setViewingBook(null);
        }}
        open={drawerOpen}
        extra={
          viewingBook && (
            <Space>
              <Tooltip title={
                !viewingBook.chapters.some(ch => ch.is_published)
                  ? "Publish at least one chapter first"
                  : ""
              }>
                <Switch
                  checked={viewingBook.is_published}
                  onChange={() => handleToggleBookPublish(viewingBook)}
                  disabled={!viewingBook.is_published && !viewingBook.chapters.some(ch => ch.is_published)}
                  checkedChildren="Published"
                  unCheckedChildren="Draft"
                />
              </Tooltip>
              <Button icon={<EditOutlined />} onClick={() => handleEditBook(viewingBook)}>
                Edit
              </Button>
              <Tooltip title={viewingBook.is_published ? "Unpublish book before deleting" : ""}>
                <Popconfirm
                  title="Delete this book?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDeleteBook(viewingBook.id)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  disabled={viewingBook.is_published}
                >
                  <Button icon={<DeleteOutlined />} danger disabled={viewingBook.is_published}>
                    Delete
                  </Button>
                </Popconfirm>
              </Tooltip>
            </Space>
          )
        }
      >
        {viewingBook && (
          <>
            {/* Thumbnail */}
            {viewingBook.thumbnail && (
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <img
                  src={getThumbnailUrl(viewingBook.thumbnail)}
                  alt={viewingBook.title}
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Book Details */}
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Authors">{getAuthorNames(viewingBook.author_ids)}</Descriptions.Item>
              <Descriptions.Item label="Genres">{getGenreNames(viewingBook.genre_ids)}</Descriptions.Item>
              <Descriptions.Item label="Narrators">{getArtistNames(viewingBook.artist_ids)}</Descriptions.Item>
              <Descriptions.Item label="Language">{getLanguageName(viewingBook.language_id)}</Descriptions.Item>
              <Descriptions.Item label="Publisher">{getPublicationName(viewingBook.publisher_id)}</Descriptions.Item>
              <Descriptions.Item label="Duration">{formatDuration(viewingBook.total_duration)}</Descriptions.Item>
              <Descriptions.Item label="Information">
                {viewingBook.information || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Chapters */}
            {renderChapters(viewingBook)}
          </>
        )}
      </Drawer>

      {/* Book Form Drawer */}
      <Drawer
        title={editingBook ? 'Edit Book' : 'Add Book'}
        placement="right"
        width={500}
        onClose={() => setBookModalOpen(false)}
        open={bookModalOpen}
        extra={
          <Space>
            <Button onClick={() => setBookModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => bookForm.submit()}>
              {editingBook ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={bookForm} layout="vertical" onFinish={handleBookSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="author_ids"
            label="Authors"
            rules={[{ required: true, message: 'Please select at least one author' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select authors"
              showSearch
              optionFilterProp="children"
            >
              {authors.map((author) => (
                <Select.Option key={author.id} value={author.id}>
                  {author.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="genre_ids"
            label="Genres"
            rules={[{ required: true, message: 'Please select at least one genre' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select genres"
              showSearch
              optionFilterProp="children"
            >
              {genres.map((genre) => (
                <Select.Option key={genre.id} value={genre.id}>
                  {genre.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="artist_ids" label="Narrators">
            <Select
              mode="multiple"
              placeholder="Select narrators"
              showSearch
              optionFilterProp="children"
              allowClear
            >
              {artists.map((artist) => (
                <Select.Option key={artist.id} value={artist.id}>
                  {artist.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="language_id" label="Language">
            <Select placeholder="Select language" showSearch optionFilterProp="children" allowClear>
              {languages.map((language) => (
                <Select.Option key={language.id} value={language.id}>
                  {language.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="information"
            label="Information (max 100 words)"
            rules={[{ required: true, message: 'Please enter information' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="publisher_id" label="Print / E-book Publisher">
            <Select placeholder="Select publisher" allowClear showSearch optionFilterProp="children">
              {publications.map((pub) => (
                <Select.Option key={pub.id} value={pub.id}>
                  {pub.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Thumbnail">
            <Upload
              listType="picture-card"
              fileList={thumbnailFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setThumbnailFileList(fileList)}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.webp"
            >
              {thumbnailFileList.length === 0 && (
                <div>
                  <PictureOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="is_adult" label="Adult Content" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Chapter Form Drawer */}
      <Drawer
        title={editingChapter ? 'Edit Chapter' : 'Add Chapter'}
        open={chapterModalOpen}
        onClose={() => !isUploading && setChapterModalOpen(false)}
        width={480}
        closable={!isUploading}
        maskClosable={!isUploading}
        extra={
          <Space>
            <Button onClick={() => setChapterModalOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => chapterForm.submit()} disabled={isUploading}>
              {editingChapter ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={chapterForm} layout="vertical" onFinish={handleChapterSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input disabled={isUploading} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description (optional)"
          >
            <Input.TextArea rows={2} maxLength={500} showCount disabled={isUploading} />
          </Form.Item>
          <Form.Item
            name="order"
            label="Order"
            rules={[{ required: true, message: 'Please enter order' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} disabled={isUploading} />
          </Form.Item>
          <Form.Item label="Chapter Image">
            <Upload
              listType="picture-card"
              fileList={chapterImageFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setChapterImageFileList(fileList)}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.webp"
              disabled={isUploading}
            >
              {chapterImageFileList.length === 0 && (
                <div>
                  <PictureOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item label="Audio File">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                fileList={fileList}
                beforeUpload={() => false}
                onChange={({ fileList: newFileList }) => {
                  setFileList(newFileList);
                  // Reset uploaded file id when user selects a new file
                  if (newFileList.length > 0 && newFileList[0].originFileObj) {
                    setUploadedFileId(null);
                    setUploadProgress(null);
                  } else if (newFileList.length === 0) {
                    setUploadedFileId(null);
                    setUploadProgress(null);
                  }
                }}
                maxCount={1}
                accept=".m4a,.aac,.wav,audio/x-m4a,audio/mp4,audio/aac,audio/wav,audio/wave"
                disabled={isUploading}
                showUploadList={{
                  showRemoveIcon: !isUploading,
                }}
              >
                <Button icon={<UploadOutlined />} disabled={isUploading}>Select Audio File</Button>
              </Upload>
              {/* Show Start Upload button when file selected but not uploaded */}
              {fileList.length > 0 && fileList[0].originFileObj && !uploadedFileId && !isUploading && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleStartAudioUpload}
                >
                  Start Upload
                </Button>
              )}
              {/* Show progress during upload */}
              {isUploading && uploadProgress !== null && (
                <Progress percent={uploadProgress} status="active" />
              )}
              {/* Show success when upload complete */}
              {uploadedFileId && !isUploading && (
                <Tag color="green" icon={<SoundOutlined />}>Audio uploaded successfully</Tag>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Processing Progress Modal */}
      <Modal
        title={processingComplete ? "Processing Complete" : "Processing Audio"}
        open={processingModalVisible}
        footer={
          processingComplete ? (
            <Button type="primary" onClick={handleProcessingModalClose}>
              OK
            </Button>
          ) : null
        }
        closable={processingComplete}
        onCancel={handleProcessingModalClose}
        maskClosable={false}
      >
        {processingComplete ? (
          <Result
            status="success"
            title="Audio Processed Successfully"
            subTitle={processingChapterName}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ marginBottom: 16 }}>{processingChapterName}</p>
            <Progress
              type="circle"
              percent={Math.round(
                Object.values(processingProgress)[Object.values(processingProgress).length - 1] || 0
              )}
              status="active"
            />
            <p style={{ marginTop: 16, color: '#666' }}>
              Converting audio to HLS format...
            </p>
          </div>
        )}
      </Modal>

      {currentlyPlaying && (
        <MiniPlayer
          audioUrl={currentlyPlaying.audioUrl}
          title={currentlyPlaying.title}
          onClose={() => setCurrentlyPlaying(null)}
        />
      )}
    </div>
  );
}

export default Books;
