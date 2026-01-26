import { useState, useEffect, useMemo } from 'react';
import {
  Tabs,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Select,
  Switch,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import type {
  NewRelease,
  FeaturedBook,
  PromotedBook,
  Book,
  Language,
  Genre,
} from '../types';
import {
  getNewReleases,
  createNewRelease,
  updateNewRelease,
  deleteNewRelease,
  reorderNewReleases,
  getFeaturedBooks,
  createFeaturedBook,
  updateFeaturedBook,
  deleteFeaturedBook,
  reorderFeaturedBooks,
  getPromotedBooks,
  createPromotedBook,
  updatePromotedBook,
  deletePromotedBook,
  reorderPromotedBooks,
  getBooks,
  getLanguages,
  getGenres,
} from '../api';

// Sortable row component
interface SortableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

function SortableRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999, background: '#fafafa' } : {}),
  };

  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />;
}

function ContentPromotion() {
  // Shared data
  const [books, setBooks] = useState<Book[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  // New Releases state
  const [newReleases, setNewReleases] = useState<NewRelease[]>([]);
  const [newReleasesLoading, setNewReleasesLoading] = useState(false);
  const [newReleaseDrawerOpen, setNewReleaseDrawerOpen] = useState(false);
  const [editingNewRelease, setEditingNewRelease] = useState<NewRelease | null>(null);
  const [newReleaseLanguageFilter, setNewReleaseLanguageFilter] = useState<string | undefined>();
  const [selectedNewReleaseLanguage, setSelectedNewReleaseLanguage] = useState<string | undefined>();
  const [newReleaseForm] = Form.useForm();

  // Featured Books state
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const [featuredBooksLoading, setFeaturedBooksLoading] = useState(false);
  const [featuredBookDrawerOpen, setFeaturedBookDrawerOpen] = useState(false);
  const [editingFeaturedBook, setEditingFeaturedBook] = useState<FeaturedBook | null>(null);
  const [featuredLanguageFilter, setFeaturedLanguageFilter] = useState<string | undefined>();
  const [selectedFeaturedLanguage, setSelectedFeaturedLanguage] = useState<string | undefined>();
  const [featuredBookForm] = Form.useForm();

  // Promoted Books state
  const [promotedBooks, setPromotedBooks] = useState<PromotedBook[]>([]);
  const [promotedBooksLoading, setPromotedBooksLoading] = useState(false);
  const [promotedBookDrawerOpen, setPromotedBookDrawerOpen] = useState(false);
  const [editingPromotedBook, setEditingPromotedBook] = useState<PromotedBook | null>(null);
  const [promotedLanguageFilter, setPromotedLanguageFilter] = useState<string | undefined>();
  const [promotedGenreFilter, setPromotedGenreFilter] = useState<string | undefined>();
  const [selectedPromotedLanguage, setSelectedPromotedLanguage] = useState<string | undefined>();
  const [selectedPromotedGenre, setSelectedPromotedGenre] = useState<string | undefined>();
  const [promotedBookForm] = Form.useForm();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch shared data
  const fetchSharedData = async () => {
    try {
      const [booksData, languagesData, genresData] = await Promise.all([
        getBooks(),
        getLanguages(),
        getGenres(),
      ]);
      setBooks(booksData);
      setLanguages(languagesData);
      setGenres(genresData);
    } catch (error) {
      message.error('Failed to fetch data');
    }
  };

  // Filter books by language
  const booksByLanguage = useMemo(() => {
    if (!selectedNewReleaseLanguage) return [];
    return books.filter((b) => b.language_id === selectedNewReleaseLanguage);
  }, [books, selectedNewReleaseLanguage]);

  const featuredBooksByLanguage = useMemo(() => {
    if (!selectedFeaturedLanguage) return [];
    return books.filter((b) => b.language_id === selectedFeaturedLanguage);
  }, [books, selectedFeaturedLanguage]);

  // Filter books by language and genre (for promoted books)
  const booksByLanguageAndGenre = useMemo(() => {
    if (!selectedPromotedLanguage || !selectedPromotedGenre) return [];
    return books.filter(
      (b) => b.language_id === selectedPromotedLanguage && b.genre_ids?.includes(selectedPromotedGenre)
    );
  }, [books, selectedPromotedLanguage, selectedPromotedGenre]);

  // New Releases functions
  const fetchNewReleases = async () => {
    setNewReleasesLoading(true);
    try {
      const data = await getNewReleases();
      setNewReleases(data);
    } catch (error) {
      message.error('Failed to fetch new releases');
    } finally {
      setNewReleasesLoading(false);
    }
  };

  const handleAddNewRelease = () => {
    setEditingNewRelease(null);
    setSelectedNewReleaseLanguage(undefined);
    newReleaseForm.resetFields();
    newReleaseForm.setFieldsValue({ is_active: true, display_order: 1 });
    setNewReleaseDrawerOpen(true);
  };

  const handleEditNewRelease = (record: NewRelease) => {
    setEditingNewRelease(record);
    setSelectedNewReleaseLanguage(record.language_id);
    newReleaseForm.setFieldsValue({
      language_id: record.language_id,
      book_ids: [record.book_id],
      display_order: record.display_order,
      is_active: record.is_active,
      starts_at: record.starts_at ? dayjs(record.starts_at) : null,
      expires_at: record.expires_at ? dayjs(record.expires_at) : null,
    });
    setNewReleaseDrawerOpen(true);
  };

  const handleDeleteNewRelease = async (id: string) => {
    try {
      await deleteNewRelease(id);
      message.success('New release removed');
      fetchNewReleases();
    } catch (error) {
      message.error('Failed to delete new release');
    }
  };

  const handleNewReleaseLanguageChange = (languageId: string) => {
    setSelectedNewReleaseLanguage(languageId);
    newReleaseForm.setFieldValue('book_ids', []);
  };

  const handleNewReleaseSubmit = async (values: { book_ids: string[]; language_id: string; display_order: number; is_active: boolean; starts_at?: dayjs.Dayjs; expires_at?: dayjs.Dayjs }) => {
    try {
      if (editingNewRelease) {
        await updateNewRelease(editingNewRelease.id, {
          display_order: values.display_order,
          is_active: values.is_active,
          starts_at: values.starts_at?.toISOString(),
          expires_at: values.expires_at?.toISOString(),
        });
        message.success('New release updated');
      } else {
        const bookIds = values.book_ids || [];
        let successCount = 0;
        let failCount = 0;
        let currentOrder = values.display_order;

        for (const bookId of bookIds) {
          try {
            await createNewRelease({
              book_id: bookId,
              language_id: values.language_id,
              display_order: currentOrder,
              is_active: values.is_active,
              starts_at: values.starts_at?.toISOString(),
              expires_at: values.expires_at?.toISOString(),
            });
            successCount++;
            currentOrder++;
          } catch {
            failCount++;
          }
        }

        if (successCount > 0) {
          message.success(`${successCount} new release(s) added`);
        }
        if (failCount > 0) {
          message.warning(`${failCount} book(s) failed (may already be added)`);
        }
      }
      setNewReleaseDrawerOpen(false);
      fetchNewReleases();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save new release';
      message.error(errorMessage);
    }
  };

  const handleNewReleaseDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = filteredNewReleases;
    const oldIndex = filtered.findIndex((item) => item.id === active.id);
    const newIndex = filtered.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    const reorderItems = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    try {
      await reorderNewReleases(reorderItems);
      fetchNewReleases();
      message.success('Order updated');
    } catch (error) {
      message.error('Failed to update order');
    }
  };

  // Featured Books functions
  const fetchFeaturedBooks = async () => {
    setFeaturedBooksLoading(true);
    try {
      const data = await getFeaturedBooks();
      setFeaturedBooks(data);
    } catch (error) {
      message.error('Failed to fetch featured books');
    } finally {
      setFeaturedBooksLoading(false);
    }
  };

  const handleAddFeaturedBook = () => {
    setEditingFeaturedBook(null);
    setSelectedFeaturedLanguage(undefined);
    featuredBookForm.resetFields();
    featuredBookForm.setFieldsValue({ is_active: true, display_order: 1 });
    setFeaturedBookDrawerOpen(true);
  };

  const handleEditFeaturedBook = (record: FeaturedBook) => {
    setEditingFeaturedBook(record);
    setSelectedFeaturedLanguage(record.language_id);
    featuredBookForm.setFieldsValue({
      language_id: record.language_id,
      book_ids: [record.book_id],
      display_order: record.display_order,
      is_active: record.is_active,
      starts_at: record.starts_at ? dayjs(record.starts_at) : null,
      expires_at: record.expires_at ? dayjs(record.expires_at) : null,
    });
    setFeaturedBookDrawerOpen(true);
  };

  const handleDeleteFeaturedBook = async (id: string) => {
    try {
      await deleteFeaturedBook(id);
      message.success('Featured book removed');
      fetchFeaturedBooks();
    } catch (error) {
      message.error('Failed to delete featured book');
    }
  };

  const handleFeaturedLanguageChange = (languageId: string) => {
    setSelectedFeaturedLanguage(languageId);
    featuredBookForm.setFieldValue('book_ids', []);
  };

  const handleFeaturedBookSubmit = async (values: { book_ids: string[]; language_id: string; display_order: number; is_active: boolean; starts_at?: dayjs.Dayjs; expires_at?: dayjs.Dayjs }) => {
    try {
      if (editingFeaturedBook) {
        await updateFeaturedBook(editingFeaturedBook.id, {
          display_order: values.display_order,
          is_active: values.is_active,
          starts_at: values.starts_at?.toISOString(),
          expires_at: values.expires_at?.toISOString(),
        });
        message.success('Featured book updated');
      } else {
        const bookIds = values.book_ids || [];
        let successCount = 0;
        let failCount = 0;
        let currentOrder = values.display_order;

        for (const bookId of bookIds) {
          try {
            await createFeaturedBook({
              book_id: bookId,
              language_id: values.language_id,
              display_order: currentOrder,
              is_active: values.is_active,
              starts_at: values.starts_at?.toISOString(),
              expires_at: values.expires_at?.toISOString(),
            });
            successCount++;
            currentOrder++;
          } catch {
            failCount++;
          }
        }

        if (successCount > 0) {
          message.success(`${successCount} featured book(s) added`);
        }
        if (failCount > 0) {
          message.warning(`${failCount} book(s) failed (may already be added)`);
        }
      }
      setFeaturedBookDrawerOpen(false);
      fetchFeaturedBooks();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save featured book';
      message.error(errorMessage);
    }
  };

  const handleFeaturedDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = filteredFeaturedBooks;
    const oldIndex = filtered.findIndex((item) => item.id === active.id);
    const newIndex = filtered.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    const reorderItems = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    try {
      await reorderFeaturedBooks(reorderItems);
      fetchFeaturedBooks();
      message.success('Order updated');
    } catch (error) {
      message.error('Failed to update order');
    }
  };

  // Promoted Books functions
  const fetchPromotedBooks = async () => {
    setPromotedBooksLoading(true);
    try {
      const data = await getPromotedBooks();
      setPromotedBooks(data);
    } catch (error) {
      message.error('Failed to fetch promoted books');
    } finally {
      setPromotedBooksLoading(false);
    }
  };

  const handleAddPromotedBook = () => {
    setEditingPromotedBook(null);
    setSelectedPromotedLanguage(undefined);
    setSelectedPromotedGenre(undefined);
    promotedBookForm.resetFields();
    promotedBookForm.setFieldsValue({ is_active: true, display_order: 1 });
    setPromotedBookDrawerOpen(true);
  };

  const handleEditPromotedBook = (record: PromotedBook) => {
    setEditingPromotedBook(record);
    // Find the book to get its language
    const book = books.find(b => b.id === record.book_id);
    setSelectedPromotedLanguage(book?.language_id);
    setSelectedPromotedGenre(record.genre_id);
    promotedBookForm.setFieldsValue({
      language_id: book?.language_id,
      genre_id: record.genre_id,
      book_ids: [record.book_id],
      display_order: record.display_order,
      is_active: record.is_active,
      starts_at: record.starts_at ? dayjs(record.starts_at) : null,
      expires_at: record.expires_at ? dayjs(record.expires_at) : null,
    });
    setPromotedBookDrawerOpen(true);
  };

  const handleDeletePromotedBook = async (id: string) => {
    try {
      await deletePromotedBook(id);
      message.success('Promoted book removed');
      fetchPromotedBooks();
    } catch (error) {
      message.error('Failed to delete promoted book');
    }
  };

  const handlePromotedLanguageChange = (languageId: string) => {
    setSelectedPromotedLanguage(languageId);
    setSelectedPromotedGenre(undefined);
    promotedBookForm.setFieldValue('genre_id', undefined);
    promotedBookForm.setFieldValue('book_ids', []);
  };

  const handlePromotedGenreChange = (genreId: string) => {
    setSelectedPromotedGenre(genreId);
    promotedBookForm.setFieldValue('book_ids', []);
  };

  const handlePromotedBookSubmit = async (values: { book_ids: string[]; genre_id: string; display_order: number; is_active: boolean; starts_at?: dayjs.Dayjs; expires_at?: dayjs.Dayjs }) => {
    try {
      if (editingPromotedBook) {
        await updatePromotedBook(editingPromotedBook.id, {
          display_order: values.display_order,
          is_active: values.is_active,
          starts_at: values.starts_at?.toISOString(),
          expires_at: values.expires_at?.toISOString(),
        });
        message.success('Promoted book updated');
      } else {
        const bookIds = values.book_ids || [];
        let successCount = 0;
        let failCount = 0;
        let currentOrder = values.display_order;

        for (const bookId of bookIds) {
          try {
            await createPromotedBook({
              book_id: bookId,
              genre_id: values.genre_id,
              display_order: currentOrder,
              is_active: values.is_active,
              starts_at: values.starts_at?.toISOString(),
              expires_at: values.expires_at?.toISOString(),
            });
            successCount++;
            currentOrder++;
          } catch {
            failCount++;
          }
        }

        if (successCount > 0) {
          message.success(`${successCount} promoted book(s) added`);
        }
        if (failCount > 0) {
          message.warning(`${failCount} book(s) failed (may already be added)`);
        }
      }
      setPromotedBookDrawerOpen(false);
      fetchPromotedBooks();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save promoted book';
      message.error(errorMessage);
    }
  };

  const handlePromotedDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filtered = filteredPromotedBooks;
    const oldIndex = filtered.findIndex((item) => item.id === active.id);
    const newIndex = filtered.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    const reorderItems = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    try {
      await reorderPromotedBooks(reorderItems);
      fetchPromotedBooks();
      message.success('Order updated');
    } catch (error) {
      message.error('Failed to update order');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSharedData();
    fetchNewReleases();
    fetchFeaturedBooks();
    fetchPromotedBooks();
  }, []);

  // Filter data for tables
  const filteredNewReleases = useMemo(() => {
    const filtered = newReleaseLanguageFilter
      ? newReleases.filter((nr) => nr.language_id === newReleaseLanguageFilter)
      : newReleases;
    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [newReleases, newReleaseLanguageFilter]);

  const filteredFeaturedBooks = useMemo(() => {
    const filtered = featuredLanguageFilter
      ? featuredBooks.filter((fb) => fb.language_id === featuredLanguageFilter)
      : featuredBooks;
    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [featuredBooks, featuredLanguageFilter]);

  const filteredPromotedBooks = useMemo(() => {
    let filtered = promotedBooks;
    if (promotedLanguageFilter) {
      // Filter by language - check the book's language
      filtered = filtered.filter((pb) => {
        const book = books.find(b => b.id === pb.book_id);
        return book?.language_id === promotedLanguageFilter;
      });
    }
    if (promotedGenreFilter) {
      filtered = filtered.filter((pb) => pb.genre_id === promotedGenreFilter);
    }
    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [promotedBooks, promotedLanguageFilter, promotedGenreFilter, books]);

  // Table columns
  const newReleasesColumns = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: () => <HolderOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    {
      title: 'Order',
      key: 'display_order',
      width: 70,
      render: (_: unknown, record: NewRelease) => record.display_order,
    },
    {
      title: 'Book',
      key: 'book',
      render: (_: unknown, record: NewRelease) => record.book.title,
    },
    {
      title: 'Language',
      key: 'language',
      render: (_: unknown, record: NewRelease) => record.language.name,
    },
    {
      title: 'Status',
      key: 'is_active',
      render: (_: unknown, record: NewRelease) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      key: 'starts_at',
      render: (_: unknown, record: NewRelease) =>
        record.starts_at ? dayjs(record.starts_at).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'End Date',
      key: 'expires_at',
      render: (_: unknown, record: NewRelease) =>
        record.expires_at ? dayjs(record.expires_at).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: NewRelease) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditNewRelease(record)} size="small" />
          <Popconfirm title="Remove this entry?" onConfirm={() => handleDeleteNewRelease(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const featuredBooksColumns = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: () => <HolderOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    {
      title: 'Order',
      key: 'display_order',
      width: 70,
      render: (_: unknown, record: FeaturedBook) => record.display_order,
    },
    {
      title: 'Book',
      key: 'book',
      render: (_: unknown, record: FeaturedBook) => record.book.title,
    },
    {
      title: 'Language',
      key: 'language',
      render: (_: unknown, record: FeaturedBook) => record.language.name,
    },
    {
      title: 'Status',
      key: 'is_active',
      render: (_: unknown, record: FeaturedBook) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      key: 'starts_at',
      render: (_: unknown, record: FeaturedBook) =>
        record.starts_at ? dayjs(record.starts_at).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'End Date',
      key: 'expires_at',
      render: (_: unknown, record: FeaturedBook) =>
        record.expires_at ? dayjs(record.expires_at).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: FeaturedBook) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditFeaturedBook(record)} size="small" />
          <Popconfirm title="Remove this entry?" onConfirm={() => handleDeleteFeaturedBook(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const promotedBooksColumns = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: () => <HolderOutlined style={{ cursor: 'grab', color: '#999' }} />,
    },
    {
      title: 'Order',
      key: 'display_order',
      width: 70,
      render: (_: unknown, record: PromotedBook) => record.display_order,
    },
    {
      title: 'Book',
      key: 'book',
      render: (_: unknown, record: PromotedBook) => record.book.title,
    },
    {
      title: 'Genre',
      key: 'genre',
      render: (_: unknown, record: PromotedBook) => record.genre.name,
    },
    {
      title: 'Status',
      key: 'is_active',
      render: (_: unknown, record: PromotedBook) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      key: 'starts_at',
      render: (_: unknown, record: PromotedBook) =>
        record.starts_at ? dayjs(record.starts_at).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'End Date',
      key: 'expires_at',
      render: (_: unknown, record: PromotedBook) =>
        record.expires_at ? dayjs(record.expires_at).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PromotedBook) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditPromotedBook(record)} size="small" />
          <Popconfirm title="Remove this entry?" onConfirm={() => handleDeletePromotedBook(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'new-releases',
      label: 'New Releases',
      children: (
        <div style={{ position: 'relative', zIndex: 0 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Select
                allowClear
                placeholder="Filter by language"
                style={{ width: 200 }}
                value={newReleaseLanguageFilter}
                onChange={setNewReleaseLanguageFilter}
                options={languages.map((l) => ({ value: l.id, label: l.name }))}
              />
              <span style={{ marginLeft: 12, color: '#666', fontSize: 12 }}>
                Drag rows to reorder{newReleaseLanguageFilter ? ' within this language' : ''}
              </span>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNewRelease}>
              Add New Release
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleNewReleaseDragEnd}>
            <SortableContext items={filteredNewReleases.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <Table
                columns={newReleasesColumns}
                dataSource={filteredNewReleases}
                rowKey="id"
                loading={newReleasesLoading}
                pagination={false}
                components={{
                  body: {
                    row: SortableRow,
                  },
                }}
              />
            </SortableContext>
          </DndContext>
        </div>
      ),
    },
    {
      key: 'featured',
      label: 'Featured Books',
      children: (
        <div style={{ position: 'relative', zIndex: 0 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Select
                allowClear
                placeholder="Filter by language"
                style={{ width: 200 }}
                value={featuredLanguageFilter}
                onChange={setFeaturedLanguageFilter}
                options={languages.map((l) => ({ value: l.id, label: l.name }))}
              />
              <span style={{ marginLeft: 12, color: '#666', fontSize: 12 }}>
                Drag rows to reorder{featuredLanguageFilter ? ' within this language' : ''}
              </span>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFeaturedBook}>
              Add Featured Book
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFeaturedDragEnd}>
            <SortableContext items={filteredFeaturedBooks.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <Table
                columns={featuredBooksColumns}
                dataSource={filteredFeaturedBooks}
                rowKey="id"
                loading={featuredBooksLoading}
                pagination={false}
                components={{
                  body: {
                    row: SortableRow,
                  },
                }}
              />
            </SortableContext>
          </DndContext>
        </div>
      ),
    },
    {
      key: 'promoted',
      label: 'Promoted Books',
      children: (
        <div style={{ position: 'relative', zIndex: 0 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Select
                allowClear
                placeholder="Filter by language"
                style={{ width: 180, marginRight: 8 }}
                value={promotedLanguageFilter}
                onChange={setPromotedLanguageFilter}
                options={languages.map((l) => ({ value: l.id, label: l.name }))}
              />
              <Select
                allowClear
                placeholder="Filter by genre"
                style={{ width: 180 }}
                value={promotedGenreFilter}
                onChange={setPromotedGenreFilter}
                options={genres.map((g) => ({ value: g.id, label: g.name }))}
              />
              <span style={{ marginLeft: 12, color: '#666', fontSize: 12 }}>
                Drag rows to reorder{(promotedLanguageFilter || promotedGenreFilter) ? ' within filter' : ''}
              </span>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPromotedBook}>
              Add Promoted Book
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePromotedDragEnd}>
            <SortableContext items={filteredPromotedBooks.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <Table
                columns={promotedBooksColumns}
                dataSource={filteredPromotedBooks}
                rowKey="id"
                loading={promotedBooksLoading}
                pagination={false}
                components={{
                  body: {
                    row: SortableRow,
                  },
                }}
              />
            </SortableContext>
          </DndContext>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Content Promotion</h1>
      </div>

      <Tabs items={tabItems} />

      {/* New Release Drawer */}
      <Drawer
        title={editingNewRelease ? 'Edit New Release' : 'Add New Release'}
        open={newReleaseDrawerOpen}
        onClose={() => setNewReleaseDrawerOpen(false)}
        width={400}
        zIndex={1001}
        extra={
          <Space>
            <Button onClick={() => setNewReleaseDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => newReleaseForm.submit()}>
              {editingNewRelease ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={newReleaseForm} layout="vertical" onFinish={handleNewReleaseSubmit}>
          <Form.Item
            name="language_id"
            label="Language"
            rules={[{ required: true, message: 'Please select a language' }]}
          >
            <Select
              placeholder="Select language"
              disabled={!!editingNewRelease}
              onChange={handleNewReleaseLanguageChange}
              options={languages.map((l) => ({ value: l.id, label: l.name }))}
            />
          </Form.Item>
          <Form.Item
            name="book_ids"
            label={editingNewRelease ? 'Book' : 'Books'}
            rules={[{ required: true, message: 'Please select at least one book' }]}
          >
            <Select
              mode={editingNewRelease ? undefined : 'multiple'}
              showSearch
              placeholder={selectedNewReleaseLanguage ? 'Select book(s)' : 'Select a language first'}
              optionFilterProp="label"
              disabled={!!editingNewRelease || !selectedNewReleaseLanguage}
              options={booksByLanguage.map((b) => ({ value: b.id, label: b.title }))}
              notFoundContent={selectedNewReleaseLanguage ? 'No books found for this language' : 'Select a language first'}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="display_order"
                label={editingNewRelease ? 'Display Order' : 'Starting Order'}
                rules={[{ required: true, message: 'Required' }]}
                tooltip={!editingNewRelease ? 'Order increments for each book' : undefined}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="starts_at" label="Start Date">
                <DatePicker style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expires_at" label="End Date">
                <DatePicker style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Featured Book Drawer */}
      <Drawer
        title={editingFeaturedBook ? 'Edit Featured Book' : 'Add Featured Book'}
        open={featuredBookDrawerOpen}
        onClose={() => setFeaturedBookDrawerOpen(false)}
        width={400}
        zIndex={1001}
        extra={
          <Space>
            <Button onClick={() => setFeaturedBookDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => featuredBookForm.submit()}>
              {editingFeaturedBook ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={featuredBookForm} layout="vertical" onFinish={handleFeaturedBookSubmit}>
          <Form.Item
            name="language_id"
            label="Language"
            rules={[{ required: true, message: 'Please select a language' }]}
          >
            <Select
              placeholder="Select language"
              disabled={!!editingFeaturedBook}
              onChange={handleFeaturedLanguageChange}
              options={languages.map((l) => ({ value: l.id, label: l.name }))}
            />
          </Form.Item>
          <Form.Item
            name="book_ids"
            label={editingFeaturedBook ? 'Book' : 'Books'}
            rules={[{ required: true, message: 'Please select at least one book' }]}
          >
            <Select
              mode={editingFeaturedBook ? undefined : 'multiple'}
              showSearch
              placeholder={selectedFeaturedLanguage ? 'Select book(s)' : 'Select a language first'}
              optionFilterProp="label"
              disabled={!!editingFeaturedBook || !selectedFeaturedLanguage}
              options={featuredBooksByLanguage.map((b) => ({ value: b.id, label: b.title }))}
              notFoundContent={selectedFeaturedLanguage ? 'No books found for this language' : 'Select a language first'}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="display_order"
                label={editingFeaturedBook ? 'Display Order' : 'Starting Order'}
                rules={[{ required: true, message: 'Required' }]}
                tooltip={!editingFeaturedBook ? 'Order increments for each book' : undefined}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="starts_at" label="Start Date">
                <DatePicker style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expires_at" label="End Date">
                <DatePicker style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Promoted Book Drawer */}
      <Drawer
        title={editingPromotedBook ? 'Edit Promoted Book' : 'Add Promoted Book'}
        open={promotedBookDrawerOpen}
        onClose={() => setPromotedBookDrawerOpen(false)}
        width={400}
        zIndex={1001}
        extra={
          <Space>
            <Button onClick={() => setPromotedBookDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => promotedBookForm.submit()}>
              {editingPromotedBook ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={promotedBookForm} layout="vertical" onFinish={handlePromotedBookSubmit}>
          <Form.Item
            name="language_id"
            label="Language"
            rules={[{ required: true, message: 'Please select a language' }]}
          >
            <Select
              placeholder="Select language first"
              disabled={!!editingPromotedBook}
              onChange={handlePromotedLanguageChange}
              options={languages.map((l) => ({ value: l.id, label: l.name }))}
            />
          </Form.Item>
          <Form.Item
            name="genre_id"
            label="Genre"
            rules={[{ required: true, message: 'Please select a genre' }]}
          >
            <Select
              placeholder={selectedPromotedLanguage ? 'Select genre' : 'Select a language first'}
              disabled={!!editingPromotedBook || !selectedPromotedLanguage}
              onChange={handlePromotedGenreChange}
              options={genres.map((g) => ({ value: g.id, label: g.name }))}
            />
          </Form.Item>
          <Form.Item
            name="book_ids"
            label={editingPromotedBook ? 'Book' : 'Books'}
            rules={[{ required: true, message: 'Please select at least one book' }]}
          >
            <Select
              mode={editingPromotedBook ? undefined : 'multiple'}
              showSearch
              placeholder={selectedPromotedGenre ? 'Select book(s)' : 'Select language and genre first'}
              optionFilterProp="label"
              disabled={!!editingPromotedBook || !selectedPromotedGenre}
              options={booksByLanguageAndGenre.map((b) => ({ value: b.id, label: b.title }))}
              notFoundContent={selectedPromotedGenre ? 'No books found for this language and genre' : 'Select language and genre first'}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="display_order"
                label={editingPromotedBook ? 'Display Order' : 'Starting Order'}
                rules={[{ required: true, message: 'Required' }]}
                tooltip={!editingPromotedBook ? 'Order increments for each book' : undefined}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Status" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="starts_at" label="Start Date">
                <DatePicker style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expires_at" label="End Date">
                <DatePicker style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
}

export default ContentPromotion;
